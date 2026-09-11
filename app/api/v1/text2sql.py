from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.models.postgres_models import User
from app.schemas.text2sql import Text2SQLRequest, Text2SQLResponse
from app.services.text2sql_service import text2sql_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/text2sql", tags=["Text-to-SQL Analytics"])

@router.post("", response_model=Text2SQLResponse)
def run_text_to_sql(
    req: Text2SQLRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sql_query = text2sql_service.natural_to_sql(req.natural_query, current_user)
    result = text2sql_service.execute_safe_query(db, sql_query, req.natural_query)
    return result
