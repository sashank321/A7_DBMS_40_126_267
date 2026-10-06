def test_valid_login(client, admin_profile):
    res = client.post("/api/v1/auth/login-json", json={
        "email": admin_profile["email"],
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "Admin"
    assert data["user_id"] == 1

def test_invalid_password(client, admin_profile):
    res = client.post("/api/v1/auth/login-json", json={
        "email": admin_profile["email"],
        "password": "wrongpassword"
    })
    assert res.status_code == 401

def test_get_current_user_profile(client, admin_headers, admin_profile):
    res = client.get("/api/v1/auth/me", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == admin_profile["email"]
    assert data["role_name"] == "Admin"
