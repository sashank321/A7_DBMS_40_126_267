import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.postgres import get_db, Base
from app.db.mongo import get_mongo_db
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health & System"])

@router.get("")
def health_check(db: Session = Depends(get_db)):
    from app.services.embedding_service import embedding_service
    embeddings = {"provider": settings.EMBEDDING_PROVIDER, "model": getattr(embedding_service.provider, "model_name", getattr(embedding_service.provider, "model", settings.EMBEDDING_MODEL)), "dimensions": embedding_service.dim}
    pg = {"status": "UNHEALTHY", "database": settings.POSTGRES_DB, "public_tables": 0, "document_embeddings": 0, "access_matrix_rows": 0}
    try:
        pg["server_version"] = db.execute(text("SHOW server_version")).scalar_one()
        pg["department_count"] = db.execute(text("SELECT count(*) FROM departments")).scalar_one()
        pg["document_count"] = db.execute(text("SELECT count(*) FROM documents")).scalar_one()
        tables = set(db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")).scalars())
        required = set(Base.metadata.tables)
        pg["public_tables"] = len(tables & required)
        pg["status"] = "HEALTHY" if required <= tables else "SCHEMA_INCOMPLETE"
        if pg["status"] == "HEALTHY":
            for table, key in [("document_embeddings", "document_embeddings"), ("v_user_access_matrix", "access_matrix_rows"), ("entity_sources", "entity_sources"), ("knowledge_entities", "graph_entities")]:
                pg[key] = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
    except Exception:
        db.rollback()
    mongo = {"status": "UNHEALTHY", "database": settings.MONGO_DB, "collections": []}
    try:
        mongo["collections"] = get_mongo_db().list_collection_names()
        mongo["status"] = "HEALTHY"
        try:
            mongo["server_version"] = get_mongo_db().client.server_info()["version"]
        except Exception:
            pass
    except Exception:
        pass
    storage = {"status": "HEALTHY" if os.path.isdir(settings.STORAGE_DIR) else "MISSING"}
    healthy = all(c["status"] == "HEALTHY" for c in [pg, mongo, storage])
    return {"status": "OPERATIONAL" if healthy else "DEGRADED", "service": settings.PROJECT_NAME, "version": settings.PROJECT_VERSION, "components": {"postgresql": pg, "mongodb": mongo, "storage_filesystem": storage, "embeddings": embeddings}}
