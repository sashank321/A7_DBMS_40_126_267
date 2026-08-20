import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "KnowledgeSphere AI"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # PostgreSQL
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", 5432))
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "Sashank@123")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "knowledgesphere_db")

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        import urllib.parse
        encoded_pwd = urllib.parse.quote_plus(self.POSTGRES_PASSWORD)
        return f"postgresql://{self.POSTGRES_USER}:{encoded_pwd}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # MongoDB
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    MONGO_DB: str = os.getenv("MONGO_DB", "knowledgesphere_nosql")

    # JWT & Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # File Storage
    STORAGE_DIR: str = os.path.abspath(os.getenv("STORAGE_DIR", "storage/documents"))

    # Vector & Embeddings
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "sentence_transformers")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    EMBEDDING_DIM: int = int(os.getenv("EMBEDDING_DIM", 384))
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", 0.15))

    # Local LLM / RAG Configuration
    LOCAL_LLM_URL: str = os.getenv("LOCAL_LLM_URL", "http://localhost:11434/v1")
    LOCAL_LLM_MODEL: str = os.getenv("LOCAL_LLM_MODEL", "llama3")
    RAG_PROVIDER: str = os.getenv("RAG_PROVIDER", "auto")

    # AI / LLM Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
