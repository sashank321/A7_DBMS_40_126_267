from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.models.postgres_models import User
from app.schemas.rag import RAGRequest, RAGResponse
from app.services.rag_service import rag_service
from app.services.mongo_service import mongo_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/rag", tags=["RAG Question Answering"])

@router.post("/query", response_model=RAGResponse)
def ask_rag_question(
    req: RAGRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = rag_service.answer_question(
        db=db,
        question=req.question,
        user=current_user,
        top_k=req.top_k
    )

    # Log to MongoDB
    mongo_service.log_activity(
        "RAG_QUERY",
        current_user.user_id,
        None,
        {
            "question": req.question,
            "intent": result["route_intent"],
            "confidence": result["confidence"],
            "citations_count": len(result["citations"]),
            "unauthorized_filtered": result["unauthorized_documents_filtered"]
        }
    )

    return result
