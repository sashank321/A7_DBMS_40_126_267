import os
from datetime import datetime, timedelta

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from passlib.context import CryptContext
from jose import jwt, JWTError


# 1. FASTAPI APPLICATION

app = FastAPI(title="FastAPI RBAC Demo")

# 2. DATABASE CONFIGURATION

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./rbac.db")

engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


# 3. USER MODEL

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)


# 4. PRODUCT MODEL

class Product(Base):
    __tablename__ = "products"

    pid = Column(Integer, primary_key=True, index=True)
    pname = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    warranty = Column(Integer, nullable=False)


# Create tables
Base.metadata.create_all(bind=engine)


# 5. DATABASE DEPENDENCY

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# 6. PASSWORD HASHING

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# 7. JWT CONFIGURATION

SECRET_KEY = "my-secret-key-for-rbac-demo"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 30


def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


# 8. OAUTH2 SCHEME

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)

# 9. FIND USER

def get_user(
    db: Session,
    username: str
):

    return db.query(User).filter(
        User.username == username
    ).first()


# 10. REGISTER USER

@app.post("/register")
def register(
    username: str,
    password: str,
    role: str = "user",
    db: Session = Depends(get_db)
):

    # Check whether username already exists

    existing_user = get_user(
        db,
        username
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    # user, admin role

    if role not in ["admin", "user"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be admin or user"
        )

    # Hash password

    hashed_password = hash_password(password)

    # Create user

    new_user = User(
        username=username,
        password_hash=hashed_password,
        role=role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "username": new_user.username,
        "role": new_user.role
    }


# 11. LOGIN

@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    # Find user

    user = get_user(
        db,
        form_data.username
    )

    # Verify username/password

    if not user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if not verify_password(
        form_data.password,
        user.password_hash
    ):

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Create JWT

    access_token = create_access_token({
        "sub": str(user.id),
        "username": user.username,
        "role": user.role
    })

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# 12. GET CURRENT USER FROM JWT

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    try:

        # Decode JWT

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        username = payload.get("username")

        if username is None:
            raise credentials_exception

    except JWTError:

        raise credentials_exception

    # Find user in database

    user = get_user(
        db,
        username
    )

    if user is None:
        raise credentials_exception

    return user


# 13. RBAC - ADMIN ONLY

def admin_required(
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


# 14. NORMAL USER + ADMIN

@app.get("/products")
def get_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    products = db.query(Product).all()

    return {
        "logged_in_user": current_user.username,
        "role": current_user.role,
        "products": products
    }


# 15. ADMIN TO ADD PRODUCT

@app.post("/products")
def add_product(
    pname: str,
    price: float,
    warranty: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    product = Product(
        pname=pname,
        price=price,
        warranty=warranty
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return {
        "message": "Product added successfully",
        "product_id": product.pid,
        "added_by": admin.username
    }


# 16. ADMIN TO UPDATE PRODUCT

@app.put("/products/{pid}")
def update_product(
    pid: int,
    pname: str,
    price: float,
    warranty: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    product = db.query(Product).filter(
        Product.pid == pid
    ).first()

    if product is None:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product.pname = pname
    product.price = price
    product.warranty = warranty

    db.commit()

    return {
        "message": "Product updated successfully",
        "updated_by": admin.username
    }


# 17. ADMIN TO DELETE PRODUCT

@app.delete("/products/{pid}")
def delete_product(
    pid: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    product = db.query(Product).filter(
        Product.pid == pid
    ).first()

    if product is None:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully",
        "deleted_by": admin.username
    }


# 18. CURRENT USER PROFILE

@app.get("/profile")
def profile(
    current_user: User = Depends(get_current_user)
):

    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role
    }