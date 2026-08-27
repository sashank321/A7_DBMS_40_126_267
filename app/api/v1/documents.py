import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.postgres import get_db
from app.models.postgres_models import Document, DocumentVersion, DocumentTag, Tag, DocumentPermission, User
from app.schemas.document import DocumentResponse, PermissionUpdate, PermissionResponse, DocumentVersionSchema
from app.services.document_service import document_service
from app.services.mongo_service import mongo_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    department_id: Optional[int] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    accessible_docs = document_service.list_accessible_documents(db, current_user)
    results = []

    for doc in accessible_docs:
        if department_id and doc.department_id != department_id:
            continue
        if category_id and doc.category_id != category_id:
            continue

        can_view, can_edit, can_delete = document_service.check_user_access(db, current_user, doc)
        latest_v = db.query(func.max(DocumentVersion.version_number)).filter(
            DocumentVersion.document_id == doc.document_id
        ).scalar() or 1
        tags_list = [dt.tag.tag_name for dt in doc.tags]

        results.append({
            "document_id": doc.document_id,
            "title": doc.title,
            "description": doc.description,
            "file_name": doc.file_name,
            "file_path": doc.file_path,
            "uploaded_by": doc.uploaded_by,
            "uploader_name": doc.uploader.name if doc.uploader else "Unknown",
            "department_id": doc.department_id,
            "department_name": doc.department.department_name if doc.department else "Unknown",
            "category_id": doc.category_id,
            "category_name": doc.category.category_name if doc.category else "Unknown",
            "created_at": doc.created_at,
            "updated_at": doc.updated_at,
            "latest_version": latest_v,
            "tags": tags_list,
            "can_view": can_view,
            "can_edit": can_edit,
            "can_delete": can_delete
        })

    # Log view telemetry into MongoDB
    mongo_service.log_activity("DOCUMENT_LIST_VIEW", current_user.user_id, None, {"returned_count": len(results)})
    return results

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    can_view, can_edit, can_delete = document_service.check_user_access(db, current_user, doc)
    if not can_view:
        raise HTTPException(status_code=403, detail="Access denied: You are not authorized to view this document.")

    latest_v = db.query(func.max(DocumentVersion.version_number)).filter(
        DocumentVersion.document_id == doc.document_id
    ).scalar() or 1
    tags_list = [dt.tag.tag_name for dt in doc.tags]

    mongo_service.log_activity("DOCUMENT_VIEW", current_user.user_id, doc.document_id, {"title": doc.title})

    return {
        "document_id": doc.document_id,
        "title": doc.title,
        "description": doc.description,
        "file_name": doc.file_name,
        "file_path": doc.file_path,
        "uploaded_by": doc.uploaded_by,
        "uploader_name": doc.uploader.name if doc.uploader else "Unknown",
        "department_id": doc.department_id,
        "department_name": doc.department.department_name if doc.department else "Unknown",
        "category_id": doc.category_id,
        "category_name": doc.category.category_name if doc.category else "Unknown",
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
        "latest_version": latest_v,
        "tags": tags_list,
        "can_view": can_view,
        "can_edit": can_edit,
        "can_delete": can_delete
    }

@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    title: str = Form(...),
    description: str = Form(""),
    department_id: int = Form(...),
    category_id: int = Form(...),
    tags: str = Form(""),  # comma-separated
    file: Optional[UploadFile] = File(None),
    content: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tag_list = [t.strip() for t in tags.split(",") if t.strip()]
    doc = document_service.create_document(
        db=db,
        title=title,
        description=description,
        user=current_user,
        department_id=department_id,
        category_id=category_id,
        tags=tag_list,
        file_obj=file,
        file_content=content
    )

    mongo_service.log_activity("DOCUMENT_UPLOAD", current_user.user_id, doc.document_id, {"title": title})

    return {
        "document_id": doc.document_id,
        "title": doc.title,
        "description": doc.description,
        "file_name": doc.file_name,
        "file_path": doc.file_path,
        "uploaded_by": doc.uploaded_by,
        "uploader_name": current_user.name,
        "department_id": doc.department_id,
        "department_name": doc.department.department_name,
        "category_id": doc.category_id,
        "category_name": doc.category.category_name,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
        "latest_version": 1,
        "tags": tag_list,
        "can_view": True,
        "can_edit": True,
        "can_delete": True
    }

@router.post("/{document_id}/versions", response_model=DocumentVersionSchema)
def add_version(
    document_id: int,
    file: Optional[UploadFile] = File(None),
    content: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    _, can_edit, _ = document_service.check_user_access(db, current_user, doc)
    if not can_edit:
        raise HTTPException(status_code=403, detail="Access denied: You do not have permission to upload new versions.")

    new_v = document_service.add_version(
        db=db,
        document_id=document_id,
        user=current_user,
        file_obj=file,
        file_content=content
    )

    mongo_service.log_activity("DOCUMENT_VERSION_ADD", current_user.user_id, document_id, {"version_number": new_v.version_number})
    return new_v

@router.get("/{document_id}/download")
def download_document_file(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    can_view, _, _ = document_service.check_user_access(db, current_user, doc)
    if not can_view:
        raise HTTPException(status_code=403, detail="Access denied.")

    real_storage_dir = os.path.realpath(settings.STORAGE_DIR)
    real_file_path = os.path.realpath(doc.file_path)
    if not real_file_path.startswith(real_storage_dir):
        raise HTTPException(status_code=403, detail="Security violation: Path traversal detected.")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Physical file not found on storage server")

    return FileResponse(path=doc.file_path, filename=doc.file_name)

@router.put("/{document_id}/permissions", response_model=PermissionResponse)
def update_permission(
    document_id: int,
    perm_in: PermissionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Only Admin or Document Owner can grant/revoke permissions
    if current_user.role.role_name != "Admin" and doc.uploaded_by != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only Admin or document owner can modify permissions.")

    target_user = db.query(User).filter(User.user_id == perm_in.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    perm = db.query(DocumentPermission).filter(
        DocumentPermission.document_id == document_id,
        DocumentPermission.user_id == perm_in.user_id
    ).first()

    if not perm:
        perm = DocumentPermission(
            document_id=document_id,
            user_id=perm_in.user_id,
            can_view=perm_in.can_view,
            can_edit=perm_in.can_edit,
            can_delete=perm_in.can_delete
        )
        db.add(perm)
    else:
        perm.can_view = perm_in.can_view
        perm.can_edit = perm_in.can_edit
        perm.can_delete = perm_in.can_delete

    db.commit()
    db.refresh(perm)

    return {
        "permission_id": perm.permission_id,
        "document_id": perm.document_id,
        "user_id": perm.user_id,
        "user_name": target_user.name,
        "user_email": target_user.email,
        "can_view": perm.can_view,
        "can_edit": perm.can_edit,
        "can_delete": perm.can_delete
    }

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    _, _, can_delete = document_service.check_user_access(db, current_user, doc)
    if not can_delete:
        raise HTTPException(status_code=403, detail="Access denied: You do not have permission to delete this document.")

    title = doc.title
    db.delete(doc)
    db.commit()

    mongo_service.log_activity("DOCUMENT_DELETE", current_user.user_id, document_id, {"title": title})
    return {"message": f"Document '{title}' deleted successfully."}
