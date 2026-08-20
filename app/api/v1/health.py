import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.postgres import get_db
from app.db.mongo import get_mongo_db
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health & System"])

@router.get("")
def health_check(db: Session = Depends(get_db)):
    # 1. PostgreSQL Status
    pg_status = "UNKNOWN"
    pg_tables = 0
    try:
        res = db.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"))
        pg_tables = res.scalar() or 0
        pg_status = "HEALTHY"
    except Exception as e:
        pg_status = f"UNHEALTHY: {str(e)}"

    # 2. MongoDB Status
    mongo_status = "UNKNOWN"
    mongo_collections = []
    try:
        m_db = get_mongo_db()
        mongo_collections = m_db.list_collection_names()
        mongo_status = "HEALTHY"
    except Exception as e:
        mongo_status = f"UNHEALTHY: {str(e)}"

    # 3. Storage Directory Status
    storage_exists = os.path.exists(settings.STORAGE_DIR)

    return {
        "status": "OPERATIONAL" if pg_status == "HEALTHY" and mongo_status == "HEALTHY" else "DEGRADED",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "components": {
            "postgresql": {
                "status": pg_status,
                "public_tables": pg_tables,
                "database": settings.POSTGRES_DB
            },
            "mongodb": {
                "status": mongo_status,
                "database": settings.MONGO_DB,
                "collections": mongo_collections
            },
            "storage_filesystem": {
                "status": "HEALTHY" if storage_exists else "MISSING",
                "path": settings.STORAGE_DIR
            }
        }
    }
