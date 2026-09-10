import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.postgres_models import DocumentChunk, DocumentEmbedding
from app.services.embedding_service import embedding_service
from app.core.config import settings

class ChunkingService:
    def __init__(self, chunk_size_words: int = 120, overlap_words: int = 25):
        self.chunk_size = chunk_size_words
        self.overlap = overlap_words

    def split_text_into_chunks(self, text: str) -> List[str]:
        if not text or not text.strip():
            return []

        # Split into sentences / paragraphs
        paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
        words = []
        for p in paragraphs:
            words.extend(p.split())

        if not words:
            return []

        chunks = []
        i = 0
        while i < len(words):
            chunk_words = words[i:i + self.chunk_size]
            chunks.append(" ".join(chunk_words))
            i += (self.chunk_size - self.overlap)
            if i >= len(words) - self.overlap and i < len(words):
                # Add remaining trailing words to the last chunk
                remainder = words[i:]
                if remainder:
                    chunks.append(" ".join(remainder))
                break

        return chunks

    def process_and_index_document(self, db: Session, document_id: int, text_content: str, version_id: Optional[int] = None) -> int:
        """
        Splits document text into chunks, inserts into document_chunks,
        computes embeddings, and persists to document_embeddings.
        Returns the number of chunks created.
        """
        # Remove existing chunks for this document if re-indexing
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
        db.commit()

        raw_chunks = self.split_text_into_chunks(text_content)
        if not raw_chunks:
            raw_chunks = [text_content.strip() or "Empty document"]

        created_count = 0
        for idx, chunk_text in enumerate(raw_chunks, 1):
            token_count = len(chunk_text.split())
            chunk_obj = DocumentChunk(
                document_id=document_id,
                version_id=version_id,
                chunk_number=idx,
                content=chunk_text,
                token_count=token_count
            )
            db.add(chunk_obj)
            db.flush()  # populate chunk_id

            # Generate real numerical vector
            vec = embedding_service.get_embedding(chunk_text)
            embedding_obj = DocumentEmbedding(
                chunk_id=chunk_obj.chunk_id,
                model_name=embedding_service.provider.get_provider_name(),
                dimensions=len(vec),
                embedding_vector=vec
            )
            db.add(embedding_obj)
            created_count += 1

        db.commit()
        return created_count

    def reindex_all_chunks(self, db: Session) -> int:
        """
        Recomputes embedding vectors for all existing chunks in the database
        using the active embedding provider.
        """
        chunks = db.query(DocumentChunk).all()
        updated = 0
        provider_name = embedding_service.provider.get_provider_name()
        for chunk in chunks:
            vec = embedding_service.get_embedding(chunk.content)
            emb = db.query(DocumentEmbedding).filter(DocumentEmbedding.chunk_id == chunk.chunk_id).first()
            if emb:
                emb.model_name = provider_name
                emb.dimensions = len(vec)
                emb.embedding_vector = vec
            else:
                emb = DocumentEmbedding(
                    chunk_id=chunk.chunk_id,
                    model_name=provider_name,
                    dimensions=len(vec),
                    embedding_vector=vec
                )
                db.add(emb)
            updated += 1
        db.commit()
        return updated

chunking_service = ChunkingService()
