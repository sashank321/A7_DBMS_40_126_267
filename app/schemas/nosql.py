from pydantic import BaseModel, Field
from app.schemas.validation import ReviewText
from typing import Optional, List, Dict, Any
from datetime import datetime

class DocumentReviewCreate(BaseModel):
    document_id: int = Field(gt=0)
    rating: int = Field(ge=1, le=5)
    review_text: ReviewText

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
    total_reviews: int
    average_rating: float
    ratings_distribution: Dict[str, int]
    action_distribution: Dict[str, int]
    recent_activities: List[Dict[str, Any]]
    status: str = "HEALTHY"
