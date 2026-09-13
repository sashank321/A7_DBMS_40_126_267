import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.services.text2sql_service import text2sql_service
from app.db.postgres import SessionLocal

client = TestClient(app)

def run_adversarial_audit():
    print("=" * 60)
    print("AUDIT 3: ADVERSARIAL RBAC & RETRIEVAL ISOLATION")
    print("=" * 60)

    # 1. Login Admin (Alice Smith - Eng)
    res_admin = client.post("/api/v1/auth/login-json", json={"email": "alice.admin@knowledgesphere.ai", "password": "password123"})
    token_admin = res_admin.json()["access_token"]
    h_admin = {"Authorization": f"Bearer {token_admin}"}

    # 2. Login Manager (Bob Jones - HR)
    res_mgr = client.post("/api/v1/auth/login-json", json={"email": "bob.hr@knowledgesphere.ai", "password": "password123"})
    token_mgr = res_mgr.json()["access_token"]
    h_mgr = {"Authorization": f"Bearer {token_mgr}"}

    # 3. Login Restricted Employee (Hannah Abbott - HR)
    res_emp = client.post("/api/v1/auth/login-json", json={"email": "hannah.hr@knowledgesphere.ai", "password": "password123"})
    token_emp = res_emp.json()["access_token"]
    h_emp = {"Authorization": f"Bearer {token_emp}"}

    # Document access counts
    docs_admin = client.get("/api/v1/documents", headers=h_admin).json()
    docs_mgr = client.get("/api/v1/documents", headers=h_mgr).json()
    docs_emp = client.get("/api/v1/documents", headers=h_emp).json()

    print(f"Admin visible documents: {len(docs_admin)}/10")
    print(f"HR Manager visible documents: {len(docs_mgr)}/10")
    print(f"Restricted Employee visible documents: {len(docs_emp)}/10")
    print(f"Employee visible titles: {[d['title'] for d in docs_emp]}")

    # Direct document endpoint access attempt by unauthorized employee
    # Doc #3 is 'System Architecture Blueprint' (Engineering)
    direct_res = client.get("/api/v1/documents/3", headers=h_emp)
    print(f"Direct access to Doc #3 by unauthorized employee: HTTP {direct_res.status_code} (Expected: 403)")
    assert direct_res.status_code == 403

    # Search leakage attempt by unauthorized employee
    search_res = client.post("/api/v1/search", json={"query": "System Architecture Blueprint microservices"}, headers=h_emp).json()
    search_titles = [r["title"] for r in search_res["results"]]
    print(f"Search results for unauthorized employee: {search_titles}")
    assert "System Architecture Blueprint" not in search_titles

    # RAG leakage attempt by unauthorized employee
    rag_res = client.post("/api/v1/rag/query", json={"question": "Explain the System Architecture Blueprint"}, headers=h_emp).json()
    print(f"RAG Unauthorized docs filtered: {rag_res['unauthorized_documents_filtered']}")
    print(f"RAG Citations: {[c['title'] for c in rag_res['citations']]}")
    assert "System Architecture Blueprint" not in [c["title"] for c in rag_res["citations"]]

    print("\n" + "=" * 60)
    print("AUDIT 4: ADVERSARIAL TEXT-TO-SQL ATTACK VECTORS")
    print("=" * 60)

    attack_vectors = [
        ("DROP TABLE documents;", "DROP attack"),
        ("DELETE FROM documents;", "DELETE attack"),
        ("UPDATE users SET role_id=1 WHERE user_id=8;", "UPDATE privilege escalation"),
        ("INSERT INTO users (name, email, password, role_id, department_id) VALUES ('Hacker', 'h@h.com', 'p', 1, 1);", "INSERT attack"),
        ("ALTER TABLE users DROP COLUMN email;", "ALTER table attack"),
        ("TRUNCATE documents;", "TRUNCATE attack"),
        ("SELECT * FROM documents; DROP TABLE documents;", "Stacked statement injection"),
        ("SELECT * FROM documents -- bypass filter\nDROP TABLE documents;", "Comment injection"),
        ("SELECT * FROM pg_shadow;", "System table access (pg_shadow)"),
        ("SELECT * FROM information_schema.tables;", "Information schema access"),
        ("SELECT * FROM non_existent_secret_table;", "Non-whitelisted table"),
        ("select * FrOm DoCuMeNtS;", "Case variation valid SELECT"),
        ("SELECT d.title, dep.department_name FROM documents d JOIN departments dep ON d.department_id = dep.department_id;", "Valid multi-table JOIN")
    ]

    db = SessionLocal()
    for sql, desc in attack_vectors:
        res = text2sql_service.execute_safe_query(db, sql, desc)
        status_symbol = "REJECTED [SAFE]" if not res["is_safe"] else "ALLOWED"
        print(f"Attack: {desc[:35]:<35} -> {status_symbol:<15} (Status: {res['status']})")
    db.close()

if __name__ == "__main__":
    run_adversarial_audit()
