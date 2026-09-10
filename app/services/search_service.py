from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.postgres_models import Document, DocumentChunk, DocumentEmbedding, User
from app.services.embedding_service import embedding_service
from app.services.document_service import document_service
from app.core.config import settings

class SearchService:
    def vector_search(
        self,
        db: Session,
        query: str,
        user: User,
        top_k: int = 5,
        department_id: Optional[int] = None,
        category_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Performs cosine similarity vector search over document chunks.
        Strictly applies RBAC permission filtering: chunks belonging to documents
        the user is not authorized to view are filtered out before ranking.
        """
        # 1. Determine accessible documents for the user
        accessible_docs = document_service.list_accessible_documents(db, user)
        accessible_doc_ids = {d.document_id for d in accessible_docs}

        if department_id:
            accessible_doc_ids = {d_id for d_id in accessible_doc_ids if db.query(Document).get(d_id).department_id == department_id}
        if category_id:
            accessible_doc_ids = {d_id for d_id in accessible_doc_ids if db.query(Document).get(d_id).category_id == category_id}

        if not accessible_doc_ids:
            return []

        # 2. Generate query vector
        query_vec = embedding_service.get_embedding(query)

        # 3. Retrieve chunks and their stored embeddings
        records = db.query(DocumentChunk, DocumentEmbedding, Document).join(
            DocumentEmbedding, DocumentChunk.chunk_id == DocumentEmbedding.chunk_id
        ).join(
            Document, DocumentChunk.document_id == Document.document_id
        ).filter(
            DocumentChunk.document_id.in_(accessible_doc_ids)
        ).all()

        scored_chunks = []
        for chunk, emb, doc in records:
            sim = embedding_service.cosine_similarity(query_vec, emb.embedding_vector)
            if sim >= settings.SIMILARITY_THRESHOLD:
                scored_chunks.append({
                    "document_id": doc.document_id,
                    "title": doc.title,
                    "chunk_id": chunk.chunk_id,
                    "chunk_number": chunk.chunk_number,
                    "content_snippet": chunk.content,
                    "similarity_score": round(sim, 4),
                    "retrieval_mode": "semantic",
                    "provenance": {
                        "document_id": doc.document_id,
                        "title": doc.title,
                        "file_name": doc.file_name,
                        "version_id": chunk.version_id,
                        "department_id": doc.department_id,
                        "category_id": doc.category_id,
                        "chunk_number": chunk.chunk_number
                    }
                })

        scored_chunks.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored_chunks[:top_k]

    def structured_search(
        self,
        db: Session,
        query: str,
        user: User,
        top_k: int = 5,
        department_id: Optional[int] = None,
        category_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Performs SQL text pattern matching across document titles, descriptions, and tags.
        """
        accessible_docs = document_service.list_accessible_documents(db, user)
        accessible_doc_ids = {d.document_id for d in accessible_docs}

        if not accessible_doc_ids:
            return []

        q_terms = [t.lower() for t in query.split() if len(t) > 2]
        matches = []

        for doc in accessible_docs:
            if department_id and doc.department_id != department_id:
                continue
            if category_id and doc.category_id != category_id:
                continue

            match_score = 0.0
            doc_text = f"{doc.title} {doc.description or ''}".lower()
            tag_names = " ".join([dt.tag.tag_name.lower() for dt in doc.tags])

            for term in q_terms:
                if term in doc.title.lower():
                    match_score += 0.5
                if term in (doc.description or "").lower():
                    match_score += 0.3
                if term in tag_names:
                    match_score += 0.4

            if match_score > 0:
                first_chunk = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.document_id).first()
                snippet = first_chunk.content if first_chunk else (doc.description or doc.title)
                matches.append({
                    "document_id": doc.document_id,
                    "title": doc.title,
                    "chunk_id": first_chunk.chunk_id if first_chunk else None,
                    "chunk_number": first_chunk.chunk_number if first_chunk else 1,
                    "content_snippet": snippet,
                    "similarity_score": round(min(match_score, 1.0), 4),
                    "retrieval_mode": "structured",
                    "provenance": {
                        "document_id": doc.document_id,
                        "title": doc.title,
                        "department": doc.department.department_name,
                        "category": doc.category.category_name
                    }
                })

        matches.sort(key=lambda x: x["similarity_score"], reverse=True)
        return matches[:top_k]

    def hybrid_search(
        self,
        db: Session,
        query: str,
        user: User,
        top_k: int = 5,
        department_id: Optional[int] = None,
        category_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Combines semantic vector search and structured search using
        Reciprocal Rank Fusion (RRF):
        RRF_Score = sum( 1 / (60 + rank) )
        """
        semantic_results = self.vector_search(db, query, user, top_k=top_k * 2, department_id=department_id, category_id=category_id)
        structured_results = self.structured_search(db, query, user, top_k=top_k * 2, department_id=department_id, category_id=category_id)

        rrf_scores: Dict[int, float] = {}
        items_by_doc: Dict[int, Dict[str, Any]] = {}

        # 1. Score semantic results
        for rank, item in enumerate(semantic_results, 1):
            doc_id = item["document_id"]
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (60.0 + rank))
            items_by_doc[doc_id] = item

        # 2. Score structured results
        for rank, item in enumerate(structured_results, 1):
            doc_id = item["document_id"]
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (60.0 + rank))
            if doc_id not in items_by_doc:
                items_by_doc[doc_id] = item

        # 3. Build fused results
        fused = []
        for doc_id, score in rrf_scores.items():
            entry = dict(items_by_doc[doc_id])
            entry["similarity_score"] = round(score * 60.0, 4)  # normalize into readable scale
            entry["retrieval_mode"] = "hybrid"
            fused.append(entry)

        fused.sort(key=lambda x: x["similarity_score"], reverse=True)
        return fused[:top_k]

search_service = SearchService()
