def test_admin_sees_all_documents(client, admin_headers):
    res = client.get("/api/v1/documents", headers=admin_headers)
    assert res.status_code == 200
    assert len(res.json()) == 10

def test_employee_document_restriction(client, employee_headers):
    res = client.get("/api/v1/documents", headers=employee_headers)
    assert res.status_code == 200
    docs = res.json()
    # Employee Hannah only has access to document 8 (Remote Work Policy)
    assert len(docs) < 10
    doc_titles = [d["title"] for d in docs]
    assert "Remote Work Policy" in doc_titles
    assert "System Architecture Blueprint" not in doc_titles

def test_unauthorized_user_management_rejected(client, employee_headers):
    # Employee cannot list all users (requires Admin or Manager)
    res = client.get("/api/v1/users", headers=employee_headers)
    assert res.status_code == 403
