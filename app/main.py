import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.db.mongo import init_mongo_indexes

# Import all API routers
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.documents import router as documents_router
from app.api.v1.search import router as search_router
from app.api.v1.graph import router as graph_router
from app.api.v1.rag import router as rag_router
from app.api.v1.text2sql import router as text2sql_router
from app.api.v1.nosql import router as nosql_router
from app.api.v1.audit import router as audit_router
from app.api.v1.health import router as health_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="An AI-Powered Enterprise Knowledge Intelligence Platform combining PostgreSQL Relational Core, MongoDB NoSQL Telemetry, Vector Search, Knowledge Graph, Safe Text-to-SQL, and Grounded RAG with strict Role-Aware Access Control (RBAC)."
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
api_v1 = FastAPI(title=f"{settings.PROJECT_NAME} API v1")
api_v1.include_router(auth_router)
api_v1.include_router(users_router)
api_v1.include_router(documents_router)
api_v1.include_router(search_router)
api_v1.include_router(graph_router)
api_v1.include_router(rag_router)
api_v1.include_router(text2sql_router)
api_v1.include_router(nosql_router)
api_v1.include_router(audit_router)
api_v1.include_router(health_router)

app.mount(settings.API_V1_STR, api_v1)

# Frontend static files mounting
frontend_dir = os.path.abspath("frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

    @app.get("/", include_in_schema=False)
    def serve_frontend_root():
        index_path = os.path.join(frontend_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "KnowledgeSphere AI backend is operational. Browse to /docs for OpenAPI documentation."}

@app.on_event("startup")
def on_startup():
    os.makedirs(settings.STORAGE_DIR, exist_ok=True)
    init_mongo_indexes()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
