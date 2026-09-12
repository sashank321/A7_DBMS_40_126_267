def test_rag_grounded_answer_with_citations(client, admin_headers):
    res = client.post("/api/v1/rag/query", json={
        "question": "What is the annual leave entitlement for employees?",
        "top_k": 3
    }, headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["citations"]) > 0
    assert "Employee Handbook 2026" in [c["title"] for c in data["citations"]]
    assert "24 days" in data["answer"] or "leave" in data["answer"].lower()

def test_rag_excludes_unauthorized_documents(client, employee_headers):
    # Employee Hannah queries about confidential architecture
    res = client.post("/api/v1/rag/query", json={
        "question": "What is the System Architecture Blueprint?",
        "top_k": 3
    }, headers=employee_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["unauthorized_documents_filtered"] > 0
    # Must NOT cite unauthorized architecture document
    assert "System Architecture Blueprint" not in [c["title"] for c in data["citations"]]
