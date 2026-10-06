from pydantic import BaseModel, Field
from app.schemas.validation import QueryText
from typing import Optional, List, Dict, Any

class SearchQuery(BaseModel):
    query: QueryText
    top_k: int = Field(default=5, ge=1, le=100, strict=True)
    department_id: Optional[int] = Field(default=None, gt=0)
    category_id: Optional[int] = Field(default=None, gt=0)

class SearchResultItem(BaseModel):
    document_id: int
    title: str
    chunk_id: Optional[int] = None
    chunk_number: Optional[int] = None
    content_snippet: str
    similarity_score: float
    retrieval_mode: str  # semantic, structured, graph, hybrid
    provenance: Dict[str, Any]

class SearchResponse(BaseModel):
    query: QueryText
    route_intent: str  # STRUCTURED, SEMANTIC, GRAPH, HYBRID
    total_results: int
    results: List[SearchResultItem]
