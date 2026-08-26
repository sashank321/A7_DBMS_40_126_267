from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DocumentTagSchema(BaseModel):
    tag_id: int
    tag_name: str

    class Config:
        from_attributes = True

class DocumentVersionSchema(BaseModel):
    version_id: int
    document_id: int
    version_number: int
    file_path: str
    uploaded_by: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    document_id: int
    title: str
    description: Optional[str] = None
    file_name: str
    file_path: str
    uploaded_by: int
    uploader_name: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    category_id: int
    category_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    latest_version: int = 1
    tags: List[str] = []
    can_view: bool = True
    can_edit: bool = False
    can_delete: bool = False

    class Config:
        from_attributes = True

class DocumentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    department_id: int
    category_id: int
    tags: List[str] = []

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[int] = None
    category_id: Optional[int] = None
    tags: Optional[List[str]] = None

class PermissionUpdate(BaseModel):
    user_id: int
    can_view: bool = True
    can_edit: bool = False
    can_delete: bool = False

class PermissionResponse(BaseModel):
    permission_id: int
    document_id: int
    user_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    can_view: bool
    can_edit: bool
    can_delete: bool

    class Config:
        from_attributes = True
