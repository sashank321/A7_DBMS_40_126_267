from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.models.postgres_models import User
from app.schemas.search import SearchQuery, SearchResponse
from app.services.router_service import router_service
from app.services.search_service import search_service
from app.services.mongo_service import mongo_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/search", tags=["Search & Retrieval"])

@router.post("", response_model=SearchResponse)
def execute_search(
    req: SearchQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Determine routing intent
    intent, explanation = router_service.classify_intent(req.query)

    if intent == "SEMANTIC":
        items = search_service.vector_search(
            db, req.query, current_user, top_k=req.top_k, department_id=req.department_id, category_id=req.category_id
        )
    elif intent == "STRUCTURED":
        items = search_service.structured_search(
            db, req.query, current_user, top_k=req.top_k, department_id=req.department_id, category_id=req.category_id
        )
    else:  # HYBRID or GRAPH
        items = search_service.hybrid_search(
            db, req.query, current_user, top_k=req.top_k, department_id=req.department_id, category_id=req.category_id
        )

    # Log search activity into MongoDB
    mongo_service.log_activity(
        "SEARCH", current_user.user_id, None,
        {"query": req.query, "intent": intent, "results_count": len(items)}
    )

    return {
        "query": req.query,
        "route_intent": intent,
        "total_results": len(items),
        "results": items
    }
