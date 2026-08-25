from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.models.postgres_models import User, Role, Department
from app.schemas.auth import UserResponse, UserCreate
from app.core.security import get_password_hash
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager"]))
):
    users = db.query(User).all()
    results = []
    for u in users:
        results.append({
            "user_id": u.user_id,
            "name": u.name,
            "email": u.email,
            "role_id": u.role_id,
            "role_name": u.role.role_name,
            "department_id": u.department_id,
            "department_name": u.department.department_name,
            "created_at": u.created_at
        })
    return results

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    u = db.query(User).filter(User.user_id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": u.user_id,
        "name": u.name,
        "email": u.email,
        "role_id": u.role_id,
        "role_name": u.role.role_name,
        "department_id": u.department_id,
        "department_name": u.department.department_name,
        "created_at": u.created_at
    }

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    req: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin"]))
):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        name=req.name,
        email=req.email,
        password=get_password_hash(req.password),
        role_id=req.role_id,
        department_id=req.department_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "user_id": new_user.user_id,
        "name": new_user.name,
        "email": new_user.email,
        "role_id": new_user.role_id,
        "role_name": new_user.role.role_name,
        "department_id": new_user.department_id,
        "department_name": new_user.department.department_name,
        "created_at": new_user.created_at
    }
