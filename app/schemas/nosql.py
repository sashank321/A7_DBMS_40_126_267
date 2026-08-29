from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class DocumentReviewCreate(BaseModel):
    document_id: int
    rating: int  # 1 to 5
    review_text: str

class DocumentReviewResponse(BaseModel):
    id: str
    document_id: int
    user_id: int
    user_name: str
    rating: int
    review_text: str
    created_at: str

class TelemetryAggregation(BaseModel):
    total_activities: int
    action_type_distribution: Dict[str, int]
    top_reviewed_documents: List[Dict[str, Any]]
    average_ratings_by_document: List[Dict[str, Any]]
