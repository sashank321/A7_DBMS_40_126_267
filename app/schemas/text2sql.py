from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class Text2SQLRequest(BaseModel):
    natural_query: str

class Text2SQLResponse(BaseModel):
    natural_query: str
    generated_sql: str
    is_safe: bool
    status: str
    row_count: int
    columns: List[str]
    results: List[Dict[str, Any]]
    explanation: str
    execution_time_ms: float
