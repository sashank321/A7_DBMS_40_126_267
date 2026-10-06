from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.nosql import DocumentReviewCreate, DocumentReviewResponse, TelemetryAggregation
from app.services.mongo_service import mongo_service
from app.models.postgres_models import User, Document
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.services.document_service import document_service
from app.api.deps import get_current_user

def require_document_access(db, user, document_id):
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if not document_service.check_user_access(db, user, document)[0]:
        raise HTTPException(status_code=403, detail="Access denied")


router = APIRouter(prefix="/nosql", tags=["NoSQL & Telemetry"])

@router.post("/reviews", response_model=DocumentReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(
    req: DocumentReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_document_access(db, current_user, req.document_id)
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_document_access(db, current_user, document_id)
    reviews = mongo_service.list_reviews_for_document(document_id)
    return reviews

@router.get("/telemetry", response_model=TelemetryAggregation)
def get_telemetry_aggregation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    is_admin = current_user.role.role_name == "Admin"
    ids = [d.document_id for d in document_service.list_accessible_documents(db, current_user)]
    stats = mongo_service.get_telemetry_aggregation(user_id=None if is_admin else current_user.user_id, accessible_doc_ids=ids)
    return stats
