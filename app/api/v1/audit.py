from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.postgres import get_db
from app.models.postgres_models import User, AuditLog
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/audit", tags=["Security Audit"])

@router.get("")
def get_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager"]))
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "log_id": log.log_id,
            "user_id": log.user_id,
            "user_name": log.user.name if log.user else f"User {log.user_id}",
            "action": log.action,
            "document_id": log.document_id,
            "document_title": log.document.title if log.document else None,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]

@router.get("/analytics")
def get_audit_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin"]))
):
    """Queries view demonstrating PostgreSQL window functions (LAG, ROW_NUMBER)."""
    result = db.execute(text("SELECT * FROM v_audit_analytics LIMIT 20;"))
    cols = list(result.keys())
    data = [dict(zip(cols, row)) for row in result.fetchall()]
    return {
        "view": "v_audit_analytics",
        "description": "SQL Window Functions demonstrating audit log transitions and recency ranking",
        "rows": data
    }
