from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.postgres import SessionLocal, Base, engine
from model import Product

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Product Management API",
    description="PUT and DELETE using FastAPI and PostgreSQL",
    version="1.0"
)

# -------------------------------
# Pydantic Request Model
# -------------------------------

class ProductCreate(BaseModel):
    pname: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0)
    warranty: int = Field(..., ge=0)


class ProductUpdate(ProductCreate):
    pass


# -------------------------------
# Database Dependency
# -------------------------------

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# -------------------------------
# GET: Retrieve All Products
# -------------------------------

@app.get("/products")
def get_products(db: Session = Depends(get_db)):

    products = db.query(Product).all()

    return [
        {
            "pid": product.pid,
            "pname": product.pname,
            "price": float(product.price),
            "warranty": product.warranty
        }
        for product in products
    ]


# -------------------------------
# POST: Create Product
# -------------------------------

@app.post("/products", status_code=201)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db)
):
    product = Product(
        pname=product_data.pname,
        price=product_data.price,
        warranty=product_data.warranty
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return {
        "message": "Product created successfully",
        "pid": product.pid,
        "pname": product.pname,
        "price": float(product.price),
        "warranty": product.warranty
    }


# -------------------------------
# PUT: Update Product
# -------------------------------

@app.put("/products/{pid}")
def update_product(
    pid: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db)
):

    # 1. Search for the product
    product = (
        db.query(Product)
        .filter(Product.pid == pid)
        .first()
    )

    # 2. If product does not exist
    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # 3. Update the product fields
    product.pname = product_data.pname
    product.price = product_data.price
    product.warranty = product_data.warranty

    # 4. Save the changes
    db.commit()

    # 5. Refresh the object
    db.refresh(product)

    # 6. Return the updated product
    return {
        "message": "Product updated successfully",
        "pid": product.pid,
        "pname": product.pname,
        "price": float(product.price),
        "warranty": product.warranty
    }


# -------------------------------
# DELETE: Delete Product
# -------------------------------

@app.delete("/products/{pid}")
def delete_product(
    pid: int,
    db: Session = Depends(get_db)
):

    # 1. Search for the product
    product = (
        db.query(Product)
        .filter(Product.pid == pid)
        .first()
    )

    # 2. If product does not exist
    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # 3. Delete the product
    db.delete(product)

    # 4. Save the changes
    db.commit()

    # 5. Return confirmation
    return {
        "message": "Product deleted successfully",
        "deleted_pid": pid
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main1:app", host="127.0.0.1", port=8000, reload=True)