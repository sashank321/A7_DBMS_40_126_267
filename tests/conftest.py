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

@pytest.fixture(scope="session")
def admin_token():
    return create_access_token(
        subject="alice.admin@knowledgesphere.ai",
        role="Admin",
        department_id=3,
        user_id=1
    )

@pytest.fixture(scope="session")
def employee_token():
    return create_access_token(
        subject="hannah.hr@knowledgesphere.ai",
        role="Employee",
        department_id=1,
        user_id=8
    )

@pytest.fixture(scope="session")
def manager_token():
    return create_access_token(
        subject="bob.hr@knowledgesphere.ai",
        role="Manager",
        department_id=1,
        user_id=2
    )

@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture(scope="session")
def employee_headers(employee_token):
    return {"Authorization": f"Bearer {employee_token}"}

@pytest.fixture(scope="session")
def manager_headers(manager_token):
    return {"Authorization": f"Bearer {manager_token}"}
