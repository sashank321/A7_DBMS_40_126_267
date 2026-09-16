from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session
from sqlalchemy.orm import mapped_column, sessionmaker


# --------------------------------------------------
# 1. FastAPI application
# --------------------------------------------------

app = FastAPI(title="JWT Authentication Application")


# --------------------------------------------------
# 2. PostgreSQL database connection
# --------------------------------------------------

DATABASE_URL = (
    "postgresql+psycopg2://postgres:Sashank%40123@localhost:5432/kldb"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    pass

# --------------------------------------------------
# 3. User database model
# --------------------------------------------------

class User(Base):
    __tablename__ = "usersJ"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True
    )

    email: Mapped[str] = mapped_column(
        String(100),
        unique=True
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255)
    )


try:
    Base.metadata.create_all(bind=engine)
except Exception:
    # Allow the app to import even when the local PostgreSQL instance is not running.
    # The database will be initialized when the service is available.
    pass


# --------------------------------------------------
# 4. Database dependency
# --------------------------------------------------

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# --------------------------------------------------
# 5. Password hashing
# --------------------------------------------------

password_hash = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --------------------------------------------------
# 6. JWT configuration
# --------------------------------------------------

SECRET_KEY = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)


# --------------------------------------------------
# 7. Pydantic schemas
# --------------------------------------------------

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    model_config = {
        "from_attributes": True
    }


class Token(BaseModel):
    access_token: str
    token_type: str


# --------------------------------------------------
# 8. Create JWT access token
# --------------------------------------------------

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


# --------------------------------------------------
# 9. User registration API
# --------------------------------------------------

@app.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.scalar(
        select(User).where(
            (User.username == user_data.username) |
            (User.email == user_data.email)
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists"
        )

    hashed_password = password_hash.hash(
        user_data.password
    )

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# --------------------------------------------------
# 10. Login API - Generate JWT
# --------------------------------------------------

@app.post("/login", response_model=Token)
def login_user(
    form_data: Annotated[
        OAuth2PasswordRequestForm,
        Depends()
    ],
    db: Session = Depends(get_db)
):
    user = db.scalar(
        select(User).where(
            User.username == form_data.username
        )
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    password_valid = password_hash.verify(
        form_data.password,
        user.hashed_password
    )

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# --------------------------------------------------
# 11. Get current authenticated user
# --------------------------------------------------

def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user = db.get(User, int(user_id))

        if user is None:
            raise credentials_exception

        return user

    except (JWTError, ValueError):
        raise credentials_exception


# --------------------------------------------------
# 12. Protected endpoint
# --------------------------------------------------

@app.get("/profile", response_model=UserResponse)
def get_profile(
    current_user: Annotated[
        User,
        Depends(get_current_user)
    ]
):
    return current_user


# --------------------------------------------------
# 13. Protected booking example
# --------------------------------------------------

@app.get("/bookings")
def get_bookings(
    current_user: Annotated[
        User,
        Depends(get_current_user)
    ]
):
    return {
        "message": "Authenticated user can access bookings",
        "user_id": current_user.id,
        "username": current_user.username
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)