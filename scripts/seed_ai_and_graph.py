import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.postgres import SessionLocal
from app.models.postgres_models import Document, User, Department, Category, DocumentVersion, Tag, DocumentTag
from app.services.chunking_service import chunking_service
from app.services.graph_service import graph_service
from app.services.mongo_service import mongo_service
from app.db.mongo import init_mongo_indexes
from app.core.config import settings

SAMPLE_DOC_TEXTS = {
    1: """# Employee Handbook 2026
KnowledgeSphere AI is committed to an inclusive, high-performance, and secure work environment.
All employees must adhere to our standard code of conduct, remote work security policies, and confidentiality agreements.
Standard working hours are flexible between 9 AM and 6 PM. Annual leave entitlement is 24 days per year.
Sick leave requires medical certification if extending beyond 3 consecutive days.
For HR inquiries, please contact Human Resources department or Bob Jones.""",

    2: """# Q1 Financial Budget Plan
The Q1 2026 budget projection allocates capital expenditure across Engineering, Marketing, and Operations.
Total estimated operating expenditure is $1.2M. Engineering infrastructure cloud costs on AWS and PostgreSQL hosting are budgeted at $350k.
Marketing customer acquisition budget is set at $200k.
All capital expenditures exceeding $10,000 must receive prior written sign-off from Charlie Brown in Finance.""",

    3: """# System Architecture Blueprint
KnowledgeSphere AI employs a decoupled microservices architecture with a PostgreSQL relational core and pgvector extension for high-dimensional embeddings.
Unstructured telemetry, user activity feeds, and document review comments are persisted in MongoDB NoSQL collections.
The FastAPI backend coordinates safe Text-to-SQL generation, Reciprocal Rank Fusion (RRF) hybrid retrieval, and knowledge graph traversal.
Authentication utilizes stateless JWT tokens with role-based access control (RBAC). Architecture designed by Alice Smith.""",

    4: """# Database Optimization Guide
This technical guide details performance tuning for PostgreSQL databases in enterprise applications.
Key recommendations:
1. Always create B-Tree indexes on foreign keys (such as uploaded_by, department_id, and category_id) to optimize JOIN performance.
2. Utilize composite indexes for multi-column uniqueness constraints.
3. Configure work_mem and shared_buffers appropriately to minimize disk spills during complex CTE aggregations and window functions.
Authored by Diana Prince, Engineering Department.""",

    5: """# Non-Disclosure Agreement Template
This Standard Corporate Non-Disclosure Agreement (NDA) governs the sharing of proprietary technology, source code, and confidential trade secrets.
Receiving parties agree not to disclose confidential information to any third party for a period of 5 years following termination of contract.
Breach of this agreement is subject to immediate injunctive relief and liquidated damages. Approved by Fiona Gallagher, Legal Department."""
}

def seed_data():
    print("Starting AI, Graph & MongoDB Seeding...")
    os.makedirs(settings.STORAGE_DIR, exist_ok=True)
    init_mongo_indexes()

    db = SessionLocal()

    # 1. Chunk and index documents
    docs = db.query(Document).all()
    for doc in docs:
        content = SAMPLE_DOC_TEXTS.get(doc.document_id, f"# {doc.title}\n{doc.description}\nDepartment: {doc.department.department_name}\nCategory: {doc.category.category_name}")
        
        # Write to physical file if not present
        file_path = os.path.join(settings.STORAGE_DIR, os.path.basename(doc.file_path))
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        doc.file_path = file_path
        db.add(doc)
        db.commit()

        # Chunk and embed
        chunk_count = chunking_service.process_and_index_document(
            db=db,
            document_id=doc.document_id,
            text_content=content
        )
        print(f"Indexed Doc #{doc.document_id} ('{doc.title}'): {chunk_count} chunks")

    # 2. Seed Knowledge Graph Entities
    print("Seeding Knowledge Graph Entities & Relationships...")
    users = db.query(User).all()
    departments = db.query(Department).all()

    # User entities & Department entities
    user_entities = {}
    for u in users:
        ent = graph_service.get_or_create_entity(db, u.name, "PERSON", f"{u.role.role_name} in {u.department.department_name}")
        user_entities[u.user_id] = ent

    dept_entities = {}
    for d in departments:
        ent = graph_service.get_or_create_entity(db, d.department_name, "DEPARTMENT", f"{d.department_name} Organizational Unit")
        dept_entities[d.department_id] = ent

    # Link Users -> Departments (WORKS_IN)
    for u in users:
        u_ent = user_entities[u.user_id]
        d_ent = dept_entities[u.department_id]
        graph_service.add_relationship(db, u_ent.entity_id, d_ent.entity_id, "WORKS_IN")

    # Document entities
    for doc in docs:
        doc_ent = graph_service.get_or_create_entity(db, doc.title, "DOCUMENT", doc.description)
        u_ent = user_entities[doc.uploaded_by]
        d_ent = dept_entities[doc.department_id]

        # Relationships
        graph_service.add_relationship(db, u_ent.entity_id, doc_ent.entity_id, "OWNS")
        graph_service.add_relationship(db, doc_ent.entity_id, d_ent.entity_id, "BELONGS_TO")

        # Provenance: Link document entity to document source
        graph_service.link_entity_to_source(db, doc_ent.entity_id, doc.document_id, confidence=1.0)

    # Technology & Project Entities
    arch_ent = graph_service.get_or_create_entity(db, "PostgreSQL", "TECHNOLOGY", "Relational Database Management System")
    pgv_ent = graph_service.get_or_create_entity(db, "pgvector", "TECHNOLOGY", "Vector similarity search extension for PostgreSQL")
    mongo_ent = graph_service.get_or_create_entity(db, "MongoDB", "TECHNOLOGY", "NoSQL document database for telemetry")
    fastapi_ent = graph_service.get_or_create_entity(db, "FastAPI", "TECHNOLOGY", "Modern Python web framework for APIs")

    graph_service.add_relationship(db, arch_ent.entity_id, pgv_ent.entity_id, "EXTENDS")
    graph_service.add_relationship(db, user_entities[1].entity_id, arch_ent.entity_id, "ARCHITECTED")
    graph_service.add_relationship(db, user_entities[4].entity_id, arch_ent.entity_id, "OPTIMIZES")

    db.commit()
    print("Knowledge Graph populated successfully!")

    # 3. Seed MongoDB activity logs and reviews
    print("Seeding MongoDB Telemetry & Reviews...")
    sample_reviews = [
        (1, 1, "Alice Smith", 5, "Clear and comprehensive employee guidelines for 2026."),
        (1, 2, "Bob Jones", 5, "Official handbook reference document for HR."),
        (3, 4, "Diana Prince", 5, "Solid microservices blueprint. Clean division between Postgres and Mongo."),
        (4, 1, "Alice Smith", 4, "Great optimization tips on CTEs and B-Tree indexes."),
        (2, 3, "Charlie Brown", 5, "Accurate Q1 financial budget breakdown.")
    ]

    for doc_id, u_id, u_name, rating, text in sample_reviews:
        mongo_service.add_document_review(doc_id, u_id, u_name, rating, text)

    sample_activities = [
        ("SEARCH", 1, None, {"query": "leave policy", "intent": "SEMANTIC"}),
        ("SEARCH", 4, None, {"query": "database optimization", "intent": "HYBRID"}),
        ("DOCUMENT_VIEW", 2, 1, {"title": "Employee Handbook 2026"}),
        ("DOCUMENT_VIEW", 1, 3, {"title": "System Architecture Blueprint"}),
        ("RAG_QUERY", 1, None, {"question": "What is our leave policy?", "intent": "SEMANTIC", "confidence": 0.95})
    ]

    for act, u_id, d_id, details in sample_activities:
        mongo_service.log_activity(act, u_id, d_id, details)

    print("MongoDB Telemetry & Reviews seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_data()
