from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.api.deps import get_current_user
from app.models.postgres_models import Department, Category, User

router = APIRouter(prefix="/catalog", tags=["Catalog"])

@router.get("")
def get_catalog(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {
        "departments": [{"id": d.department_id, "name": d.department_name} for d in db.query(Department).order_by(Department.department_name)],
        "categories": [{"id": c.category_id, "name": c.category_name} for c in db.query(Category).order_by(Category.category_name)],
    }
