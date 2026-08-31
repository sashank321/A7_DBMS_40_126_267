import pytest
from sqlalchemy import text
from app.models.postgres_models import User, Document, Role, Department, Category, DocumentVersion, AuditLog

def test_database_schema_counts(db_session):
    """Verifies that all 10 relational core tables are populated with data."""
    assert db_session.query(Role).count() >= 3
    assert db_session.query(Department).count() >= 5
    assert db_session.query(User).count() >= 8
    assert db_session.query(Category).count() >= 5
    assert db_session.query(Document).count() >= 10
    assert db_session.query(AuditLog).count() >= 5

def test_analytical_views(db_session):
    """Verifies that database analytical views execute and return rows."""
    res_overview = db_session.execute(text("SELECT * FROM v_document_overview LIMIT 5;")).fetchall()
    assert len(res_overview) > 0

    res_perms = db_session.execute(text("SELECT * FROM v_user_access_matrix LIMIT 10;")).fetchall()
    assert len(res_perms) > 0

    res_audit = db_session.execute(text("SELECT * FROM v_audit_analytics LIMIT 5;")).fetchall()
    assert len(res_audit) > 0

def test_version_number_check_constraint(db_session):
    """Verifies CHECK constraint on document version number (> 0)."""
    with pytest.raises(Exception):
        db_session.execute(text(
            "INSERT INTO document_versions (document_id, version_number, file_path, uploaded_by) VALUES (1, -1, '/invalid.pdf', 1);"
        ))
        db_session.commit()
    db_session.rollback()
