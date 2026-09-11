from app.services.text2sql_service import text2sql_service

def test_safe_text_to_sql_execution(client, admin_headers):
    res = client.post("/api/v1/text2sql", json={
        "natural_query": "How many documents are in each department?"
    }, headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["is_safe"] is True
    assert data["status"] == "SUCCESS"
    assert data["row_count"] > 0
    assert "Engineering" in [r.get("department_name") for r in data["results"]]

def test_destructive_query_rejection(db_session):
    queries = [
        "DROP TABLE users;",
        "INSERT INTO roles VALUES (99, 'Hacker');",
        "DELETE FROM documents;",
        "ALTER TABLE users DROP COLUMN email;",
        "TRUNCATE TABLE audit_logs;"
    ]
    for q in queries:
        res = text2sql_service.execute_safe_query(db_session, q, "destructive test")
        assert res["is_safe"] is False
        assert res["status"] == "REJECTED"
