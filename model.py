from sqlalchemy import Column, Float, Integer, String
from sqlalchemy.orm import synonym
from app.db.postgres import Base, engine


class Product(Base):
    __tablename__ = "products"

    pid = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    pname = synonym("name")
    price = Column(Float, nullable=False)
    warranty = Column(Integer, nullable=False, default=0)


Base.metadata.create_all(bind=engine)
