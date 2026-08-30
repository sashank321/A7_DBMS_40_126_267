from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.nosql import DocumentReviewCreate, DocumentReviewResponse, TelemetryAggregation
from app.services.mongo_service import mongo_service
from app.models.postgres_models import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/nosql", tags=["NoSQL & Telemetry"])

@router.post("/reviews", response_model=DocumentReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(
    req: DocumentReviewCreate,
    current_user: User = Depends(get_current_user)
):
    doc = mongo_service.add_document_review(
        document_id=req.document_id,
        user_id=current_user.user_id,
        user_name=current_user.name,
        rating=req.rating,
        review_text=req.review_text
    )
    return {
        "id": doc["id"],
        "document_id": doc["document_id"],
        "user_id": doc["user_id"],
        "user_name": doc["user_name"],
        "rating": doc["rating"],
        "review_text": doc["review_text"],
        "created_at": doc["created_at"]
    }

@router.get("/reviews/{document_id}", response_model=List[DocumentReviewResponse])
def get_document_reviews(
    document_id: int,
    current_user: User = Depends(get_current_user)
):
    reviews = mongo_service.list_reviews_for_document(document_id)
    return reviews

@router.get("/telemetry", response_model=TelemetryAggregation)
def get_telemetry_aggregation(
    current_user: User = Depends(get_current_user)
):
    stats = mongo_service.get_telemetry_aggregation()
    return stats
