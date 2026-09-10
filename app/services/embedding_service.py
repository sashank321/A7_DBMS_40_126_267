import numpy as np
from typing import List
from app.services.embedding_provider import get_embedding_provider, BaseEmbeddingProvider

class EmbeddingService:
    """
    High-level embedding service that coordinates vector operations across the platform.
    Delegates embedding generation to the actively configured BaseEmbeddingProvider
    (SentenceTransformers, OpenAI, or DeterministicDevelopmentProvider).
    """
    @property
    def provider(self) -> BaseEmbeddingProvider:
        return get_embedding_provider()

    @property
    def dim(self) -> int:
        return self.provider.get_dimensions()

    def get_embedding(self, text: str) -> List[float]:
        """
        Generates an L2-normalized dense embedding vector for text using
        the active embedding provider.
        """
        return self.provider.get_embedding(text)

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """
        Computes true mathematical cosine similarity between two vectors.
        Safely checks for dimension match and returns 0.0 if dimensions differ.
        """
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        a = np.array(vec_a, dtype=np.float64)
        b = np.array(vec_b, dtype=np.float64)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a < 1e-9 or norm_b < 1e-9:
            return 0.0
        dot = np.dot(a, b)
        return float(np.clip(dot / (norm_a * norm_b), -1.0, 1.0))

embedding_service = EmbeddingService()
