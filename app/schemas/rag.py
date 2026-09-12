from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class RAGRequest(BaseModel):
    question: str
    top_k: int = 4

class Citation(BaseModel):
    document_id: int
    title: str
    version_number: Optional[int] = 1
    chunk_id: int
    snippet: str

class RAGResponse(BaseModel):
    question: str
    answer: str
    route_intent: str
    confidence: float
    citations: List[Citation]
    unauthorized_documents_filtered: int
    llm_provider: Optional[str] = "Local Grounded Synthesizer"
    is_generative_llm: Optional[bool] = False
    reasoning: Optional[str] = None
