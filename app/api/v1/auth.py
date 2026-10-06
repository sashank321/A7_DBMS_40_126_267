from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.models.postgres_models import User
from app.schemas.auth import (
    LoginRequest, Token, UserResponse,
    RequestOTPRequest, RequestOTPResponse, VerifyOTPRequest, ResendOTPRequest
)
from app.core.security import verify_password, create_access_token
from app.api.deps import get_current_user
from app.services.otp_service import otp_service
from app.models.postgres_models import AuditLog

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/request-otp", response_model=RequestOTPResponse)
def request_otp(
    req: RequestOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Step 1 of 2FA Login: Validates credentials and dispatches a 6-digit OTP.
    Free, local, zero-cost delivery to terminal and optional SMTP.
    """
    user = db.query(User).filter(User.email == req.email.strip()).first()
    if not user or not verify_password(req.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    code, ttl_seconds = otp_service.create_and_send_otp(db, email=user.email, purpose="login")
    return {
        "status": "otp_sent",
        "message": f"A 6-digit verification code has been dispatched to {user.email}.",
        "email": user.email,
        "expires_in_seconds": ttl_seconds,
        "dev_otp": code
    }

@router.post("/verify-otp", response_model=Token)
def verify_otp(
    req: VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Step 2 of 2FA Login: Verifies the 6-digit OTP code and issues JWT token.
    """
    user = db.query(User).filter(User.email == req.email.strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    is_valid, msg = otp_service.verify_otp(db, email=user.email, entered_code=req.otp.strip(), purpose="login")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )

    # Record successful login in audit log
    audit_entry = AuditLog(
        user_id=user.user_id,
        action="USER_LOGIN_OTP_VERIFIED"
    )
    db.add(audit_entry)
    db.commit()

    token = create_access_token(
        subject=user.email,
        role=user.role.role_name,
        department_id=user.department_id,
        user_id=user.user_id
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role.role_name,
        "department_id": user.department_id
    }

@router.post("/resend-otp", response_model=RequestOTPResponse)
def resend_otp(
    req: ResendOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Resends a fresh 6-digit verification code for an existing user.
    """
    user = db.query(User).filter(User.email == req.email.strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    code, ttl_seconds = otp_service.create_and_send_otp(db, email=user.email, purpose="login")
    return {
        "status": "otp_sent",
        "message": f"A new 6-digit verification code has been dispatched to {user.email}.",
        "email": user.email,
        "expires_in_seconds": ttl_seconds,
        "dev_otp": code
    }

@router.post("/login-json", response_model=Token)
def login_json(
    req: LoginRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == req.email.strip()).first()
    if not user or not verify_password(req.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # If an OTP was provided in the direct request, verify it
    if req.otp:
        is_valid, msg = otp_service.verify_otp(db, email=user.email, entered_code=req.otp.strip(), purpose="login")
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=msg
            )

    token = create_access_token(
        subject=user.email,
        role=user.role.role_name,
        department_id=user.department_id,
        user_id=user.user_id
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role.role_name,
        "department_id": user.department_id
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "name": current_user.name,
        "email": current_user.email,
        "role_id": current_user.role_id,
        "role_name": current_user.role.role_name,
        "department_id": current_user.department_id,
        "department_name": current_user.department.department_name,
        "created_at": current_user.created_at
    }

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """OAuth2 password form login endpoint for Swagger UI Authorization."""
    user = db.query(User).filter(User.email == form_data.username.strip()).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        subject=user.email,
        role=user.role.role_name,
        department_id=user.department_id,
        user_id=user.user_id
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role.role_name,
        "department_id": user.department_id
    }


@router.get("/demo-accounts")
def get_demo_accounts(db: Session = Depends(get_db)):
    from app.core.config import settings
    emails = settings.DEMO_ACCOUNT_EMAILS
    if emails is None:
        emails = ["alice.admin@knowledgesphere.ai", "bob.hr@knowledgesphere.ai", "hannah.hr@knowledgesphere.ai"]
    if not emails:
        return []
    users = db.query(User).filter(User.email.in_(emails)).all()
    return [{"email": u.email, "name": u.name, "role": u.role.role_name, "department_name": u.department.department_name} for u in users]

