from pydantic import BaseModel, Field
from app.schemas.validation import QueryText
from typing import Optional, List, Dict, Any

class RAGRequest(BaseModel):
    question: QueryText
    top_k: int = Field(default=4, ge=1, le=100, strict=True)

class Citation(BaseModel):
    document_id: int
    title: str
    version_number: Optional[int] = 1
    chunk_id: int
    snippet: str

class RAGResponse(BaseModel):
    question: QueryText
    answer: str
    route_intent: str
    confidence: float
    citations: List[Citation]
    unauthorized_documents_filtered: int
    llm_provider: Optional[str] = "Local Grounded Synthesizer"
    is_generative_llm: Optional[bool] = False
    reasoning: Optional[str] = None
