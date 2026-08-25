from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float, ARRAY, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.postgres import Base

class Role(Base):
    __tablename__ = "roles"

    role_id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), nullable=False, unique=True)

    users = relationship("User", back_populates="role")


class Department(Base):
    __tablename__ = "departments"

    department_id = Column(Integer, primary_key=True, index=True)
    department_name = Column(String(100), nullable=False, unique=True)

    users = relationship("User", back_populates="department")
    documents = relationship("Document", back_populates="department")


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.role_id", ondelete="RESTRICT"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.department_id", ondelete="RESTRICT"), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())

    role = relationship("Role", back_populates="users")
    department = relationship("Department", back_populates="users")
    uploaded_documents = relationship("Document", back_populates="uploader", foreign_keys="Document.uploaded_by")
    audit_logs = relationship("AuditLog", back_populates="user")
    permissions = relationship("DocumentPermission", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(100), nullable=False, unique=True)

    documents = relationship("Document", back_populates="category")


class Document(Base):
    __tablename__ = "documents"

    document_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.department_id", ondelete="RESTRICT"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.category_id", ondelete="RESTRICT"), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    uploader = relationship("User", back_populates="uploaded_documents", foreign_keys=[uploaded_by])
    department = relationship("Department", back_populates="documents")
    category = relationship("Category", back_populates="documents")
    tags = relationship("DocumentTag", back_populates="document", cascade="all, delete-orphan")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    permissions = relationship("DocumentPermission", back_populates="document", cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    entity_sources = relationship("EntitySource", back_populates="document", cascade="all, delete-orphan")


class Tag(Base):
    __tablename__ = "tags"

    tag_id = Column(Integer, primary_key=True, index=True)
    tag_name = Column(String(50), nullable=False, unique=True)

    document_tags = relationship("DocumentTag", back_populates="tag", cascade="all, delete-orphan")


class DocumentTag(Base):
    __tablename__ = "document_tags"

    document_id = Column(Integer, ForeignKey("documents.document_id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.tag_id", ondelete="CASCADE"), primary_key=True)

    document = relationship("Document", back_populates="tags")
    tag = relationship("Tag", back_populates="document_tags")


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    version_id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.document_id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.user_id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("document_id", "version_number", name="uq_doc_version"),
    )

    document = relationship("Document", back_populates="versions")
    uploader = relationship("User")
    chunks = relationship("DocumentChunk", back_populates="version")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.document_id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)

    user = relationship("User", back_populates="audit_logs")
    document = relationship("Document")


class DocumentPermission(Base):
    __tablename__ = "document_permissions"

    permission_id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.document_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    can_view = Column(Boolean, default=True)
    can_edit = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)

    __table_args__ = (
        UniqueConstraint("document_id", "user_id", name="uq_doc_user_perm"),
    )

    document = relationship("Document", back_populates="permissions")
    user = relationship("User", back_populates="permissions")


# ==========================================
# AI & Knowledge Graph Extension Models
# ==========================================

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    chunk_id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.document_id", ondelete="CASCADE"), nullable=False, index=True)
    version_id = Column(Integer, ForeignKey("document_versions.version_id", ondelete="CASCADE"), nullable=True)
    chunk_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("document_id", "chunk_number", name="uq_doc_chunk"),
    )

    document = relationship("Document", back_populates="chunks")
    version = relationship("DocumentVersion", back_populates="chunks")
    embedding = relationship("DocumentEmbedding", back_populates="chunk", uselist=False, cascade="all, delete-orphan")
    entity_sources = relationship("EntitySource", back_populates="chunk")


class DocumentEmbedding(Base):
    __tablename__ = "document_embeddings"

    embedding_id = Column(Integer, primary_key=True, index=True)
    chunk_id = Column(Integer, ForeignKey("document_chunks.chunk_id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    model_name = Column(String(100), nullable=False, default="all-MiniLM-L6-v2")
    dimensions = Column(Integer, nullable=False)
    embedding_vector = Column(ARRAY(Float), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    chunk = relationship("DocumentChunk", back_populates="embedding")


class KnowledgeEntity(Base):
    __tablename__ = "knowledge_entities"

    entity_id = Column(Integer, primary_key=True, index=True)
    entity_name = Column(String(200), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False, index=True)  # PERSON, DEPARTMENT, SYSTEM, POLICY, PROJECT
    description = Column(Text, nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("entity_name", "entity_type", name="uq_entity_name_type"),
    )

    outgoing_relationships = relationship("KnowledgeRelationship", foreign_keys="KnowledgeRelationship.source_entity_id", back_populates="source_entity", cascade="all, delete-orphan")
    incoming_relationships = relationship("KnowledgeRelationship", foreign_keys="KnowledgeRelationship.target_entity_id", back_populates="target_entity", cascade="all, delete-orphan")
    sources = relationship("EntitySource", back_populates="entity", cascade="all, delete-orphan")


class KnowledgeRelationship(Base):
    __tablename__ = "knowledge_relationships"

    relationship_id = Column(Integer, primary_key=True, index=True)
    source_entity_id = Column(Integer, ForeignKey("knowledge_entities.entity_id", ondelete="CASCADE"), nullable=False, index=True)
    target_entity_id = Column(Integer, ForeignKey("knowledge_entities.entity_id", ondelete="CASCADE"), nullable=False, index=True)
    relation_type = Column(String(100), nullable=False, index=True)  # WORKS_IN, OWNS, REFERENCES, DEPENDS_ON, COVERS
    weight = Column(Float, default=1.0)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("source_entity_id", "target_entity_id", "relation_type", name="uq_entity_rel"),
    )

    source_entity = relationship("KnowledgeEntity", foreign_keys=[source_entity_id], back_populates="outgoing_relationships")
    target_entity = relationship("KnowledgeEntity", foreign_keys=[target_entity_id], back_populates="incoming_relationships")


class EntitySource(Base):
    __tablename__ = "entity_sources"

    source_id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, ForeignKey("knowledge_entities.entity_id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.document_id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(Integer, ForeignKey("document_chunks.chunk_id", ondelete="SET NULL"), nullable=True)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("entity_id", "document_id", "chunk_id", name="uq_entity_source"),
    )

    entity = relationship("KnowledgeEntity", back_populates="sources")
    document = relationship("Document", back_populates="entity_sources")
    chunk = relationship("DocumentChunk", back_populates="entity_sources")
