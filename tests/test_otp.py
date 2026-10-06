import pytest
from datetime import datetime, timedelta, timezone
from app.models.postgres_models import UserOTP


def test_request_otp_success(client, admin_profile):
    res = client.post("/api/v1/auth/request-otp", json={
        "email": admin_profile["email"],
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "otp_sent"
    assert data["email"] == admin_profile["email"]
    assert data["expires_in_seconds"] == 300
    assert len(data["dev_otp"]) == 6
    assert data["dev_otp"].isdigit()

def test_request_otp_invalid_password(client, admin_profile):
    res = client.post("/api/v1/auth/request-otp", json={
        "email": admin_profile["email"],
        "password": "wrongpassword"
    })
    assert res.status_code == 401

def test_verify_otp_success(client, admin_profile):
    # Step 1: Request OTP
    req_res = client.post("/api/v1/auth/request-otp", json={
        "email": admin_profile["email"],
        "password": "password123"
    })
    assert req_res.status_code == 200
    code = req_res.json()["dev_otp"]

    # Step 2: Verify OTP
    verify_res = client.post("/api/v1/auth/verify-otp", json={
        "email": admin_profile["email"],
        "otp": code
    })
    assert verify_res.status_code == 200
    token_data = verify_res.json()
    assert "access_token" in token_data
    assert token_data["email"] == admin_profile["email"]
    assert token_data["role"] == "Admin"

    # Step 3: Replay attack prevention (used OTP cannot be used again)
    replay_res = client.post("/api/v1/auth/verify-otp", json={
        "email": admin_profile["email"],
        "otp": code
    })
    assert replay_res.status_code == 400

def test_verify_otp_invalid_code(client, admin_profile):
    # Request OTP
    client.post("/api/v1/auth/request-otp", json={
        "email": admin_profile["email"],
        "password": "password123"
    })

    # Submit invalid code
    bad_res = client.post("/api/v1/auth/verify-otp", json={
        "email": admin_profile["email"],
        "otp": "000000"
    })
    assert bad_res.status_code == 400
    assert "Incorrect verification code" in bad_res.json()["detail"]

def test_verify_otp_expired(client, db_session, admin_profile):
    # Create manually expired OTP
    expired_otp = UserOTP(
        email=admin_profile["email"],
        otp_code="999888",
        purpose="login",
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=10),

        is_used=False,
        attempts=0
    )
    db_session.add(expired_otp)
    db_session.commit()

    res = client.post("/api/v1/auth/verify-otp", json={
        "email": admin_profile["email"],
        "otp": "999888"
    })
    assert res.status_code == 400
    assert "expired" in res.json()["detail"].lower()

def test_resend_otp(client, admin_profile):
    res = client.post("/api/v1/auth/resend-otp", json={
        "email": admin_profile["email"]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "otp_sent"
    assert len(data["dev_otp"]) == 6

def test_direct_login_with_valid_otp(client, admin_profile):
    req_res = client.post("/api/v1/auth/request-otp", json={
        "email": admin_profile["email"],
        "password": "password123"
    })
    code = req_res.json()["dev_otp"]

    login_res = client.post("/api/v1/auth/login-json", json={
        "email": admin_profile["email"],
        "password": "password123",
        "otp": code
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()
