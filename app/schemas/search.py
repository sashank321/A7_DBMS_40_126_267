from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class SearchQuery(BaseModel):
    query: str
    top_k: int = 5
    department_id: Optional[int] = None
    category_id: Optional[int] = None

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
    query: str
    route_intent: str  # STRUCTURED, SEMANTIC, GRAPH, HYBRID
    total_results: int
    results: List[SearchResultItem]
