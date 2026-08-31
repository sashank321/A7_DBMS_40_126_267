def test_valid_login(client):
    res = client.post("/api/v1/auth/login-json", json={
        "email": "alice.admin@knowledgesphere.ai",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "Admin"
    assert data["user_id"] == 1

def test_invalid_password(client):
    res = client.post("/api/v1/auth/login-json", json={
        "email": "alice.admin@knowledgesphere.ai",
        "password": "wrongpassword"
    })
    assert res.status_code == 401

def test_get_current_user_profile(client, admin_headers):
    res = client.get("/api/v1/auth/me", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "alice.admin@knowledgesphere.ai"
    assert data["role_name"] == "Admin"
