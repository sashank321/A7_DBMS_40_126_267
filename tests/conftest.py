import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.postgres import SessionLocal
from app.core.security import create_access_token
from app.models.postgres_models import User

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def demo_profile(user_id):
    with SessionLocal() as db:
        user = db.get(User, user_id)
        return {"user_id": user.user_id, "email": user.email, "name": user.name, "role": user.role.role_name, "department_id": user.department_id}

@pytest.fixture(scope="session")
def admin_profile():
    return demo_profile(1)

@pytest.fixture(scope="session")
def admin_token(admin_profile):
    return create_access_token(subject=admin_profile["email"], role=admin_profile["role"], department_id=admin_profile["department_id"], user_id=1)

@pytest.fixture(scope="session")
def employee_token():
    profile = demo_profile(8)
    return create_access_token(subject=profile["email"], role=profile["role"], department_id=profile["department_id"], user_id=8)

@pytest.fixture(scope="session")
def manager_token():
    profile = demo_profile(2)
    return create_access_token(subject=profile["email"], role=profile["role"], department_id=profile["department_id"], user_id=2)

@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture(scope="session")
def employee_headers(employee_token):
    return {"Authorization": f"Bearer {employee_token}"}

@pytest.fixture(scope="session")
def manager_headers(manager_token):
    return {"Authorization": f"Bearer {manager_token}"}
