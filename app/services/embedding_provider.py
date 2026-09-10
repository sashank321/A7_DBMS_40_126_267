import os
import re
import zlib
import logging
from abc import ABC, abstractmethod
from typing import List, Optional
import numpy as np

logger = logging.getLogger(__name__)

class BaseEmbeddingProvider(ABC):
    @abstractmethod
    def get_embedding(self, text: str) -> List[float]:
        """Generates a dense numerical embedding vector for the input text."""
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns the human-readable identifier of the embedding model/provider."""
        pass

    @abstractmethod
    def get_dimensions(self) -> int:
        """Returns the dimensionality of the generated embedding vectors."""
        pass


class SentenceTransformerEmbeddingProvider(BaseEmbeddingProvider):
    """
    Genuine Pretrained Local Semantic Embedding Provider.
    Uses 'all-MiniLM-L6-v2' via sentence-transformers to produce 384-dimensional
    dense contextual semantic vectors. Runs completely offline on standard CPU.
    """
    _instance = None
    _model = None

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.dim = 384
        self._load_model()

    def _load_model(self):
        if SentenceTransformerEmbeddingProvider._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading pretrained SentenceTransformer model: {self.model_name}...")
                SentenceTransformerEmbeddingProvider._model = SentenceTransformer(self.model_name)
            except Exception as e:
                logger.error(f"Failed to load SentenceTransformer ({self.model_name}): {e}")
                SentenceTransformerEmbeddingProvider._model = None

    def get_provider_name(self) -> str:
        return f"SentenceTransformers ({self.model_name})"

    def get_dimensions(self) -> int:
        return self.dim

    def get_embedding(self, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * self.dim

        if SentenceTransformerEmbeddingProvider._model is None:
            self._load_model()

        if SentenceTransformerEmbeddingProvider._model is not None:
            raw_vec = SentenceTransformerEmbeddingProvider._model.encode(
                text.strip(),
                show_progress_bar=False,
                normalize_embeddings=True
            )
            return [round(float(x), 6) for x in raw_vec]

        # Graceful fallback if model loading failed
        dev = DeterministicDevelopmentProvider(dim=self.dim)
        return dev.get_embedding(text)


class OpenAIEmbeddingProvider(BaseEmbeddingProvider):
    """Production provider using OpenAI text-embedding-3-small API."""
    def __init__(self, api_key: str, model: str = "text-embedding-3-small"):
        self.api_key = api_key
        self.model = model

    def get_provider_name(self) -> str:
        return f"OpenAI ({self.model})"

    def get_dimensions(self) -> int:
        return 1536

    def get_embedding(self, text: str) -> List[float]:
        import requests
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "input": text,
            "model": self.model
        }
        response = requests.post("https://api.openai.com/v1/embeddings", json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            return response.json()["data"][0]["embedding"]
        raise RuntimeError(f"OpenAI Embedding API error ({response.status_code}): {response.text}")


class DeterministicDevelopmentProvider(BaseEmbeddingProvider):
    """
    Deterministic CRC32 feature hashing vectorizer for offline tests and development.
    Guarantees cross-platform determinism across all processes.
    NOTE: Kept as a fast test fallback. For genuine neural semantics, use SentenceTransformerEmbeddingProvider.
    """
    def __init__(self, dim: int = 128):
        self.dim = dim
        self.stop_words = {
            "what", "is", "our", "and", "the", "for", "in", "to", "of", "a", "an",
            "this", "that", "it", "with", "as", "at", "by", "from", "on", "or", "are", "be"
        }

    def get_provider_name(self) -> str:
        return f"DeterministicDevelopmentProvider (CRC32 {self.dim}-dim Hashing)"

    def get_dimensions(self) -> int:
        return self.dim

    def _tokenize(self, text: str) -> List[str]:
        all_words = re.findall(r'\b[a-zA-Z]{2,}\b', text.lower())
        words = [w for w in all_words if w not in self.stop_words]
        tokens = list(words)
        for i in range(len(words) - 1):
            tokens.append(f"{words[i]}_{words[i+1]}")
        return tokens

    def get_embedding(self, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * self.dim

        tokens = self._tokenize(text)
        vec = np.zeros(self.dim, dtype=np.float64)

        for token in tokens:
            h = zlib.crc32(token.encode("utf-8"))
            idx = h % self.dim
            sign = 1.0 if (h & 1) == 0 else -1.0
            vec[idx] += sign

        norm = np.linalg.norm(vec)
        if norm > 1e-9:
            vec = vec / norm
        else:
            vec[0] = 1.0

        return [round(float(x), 6) for x in vec]


class LocalSemanticEmbeddingProvider(BaseEmbeddingProvider):
    """
    Unified local semantic provider that delegates to SentenceTransformerEmbeddingProvider
    if sentence-transformers is installed, and gracefully falls back to DeterministicDevelopmentProvider.
    """
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.delegate: BaseEmbeddingProvider
        try:
            self.delegate = SentenceTransformerEmbeddingProvider(model_name=model_name)
        except Exception:
            self.delegate = DeterministicDevelopmentProvider(dim=384)

    def get_provider_name(self) -> str:
        return self.delegate.get_provider_name()

    def get_dimensions(self) -> int:
        return self.delegate.get_dimensions()

    def get_embedding(self, text: str) -> List[float]:
        return self.delegate.get_embedding(text)


def get_embedding_provider() -> BaseEmbeddingProvider:
    """
    Factory function resolving the configured embedding provider.
    Controlled by the EMBEDDING_PROVIDER environment variable:
      - 'sentence_transformers' / 'local': SentenceTransformerEmbeddingProvider (all-MiniLM-L6-v2, 384-dim)
      - 'openai': OpenAIEmbeddingProvider (text-embedding-3-small, 1536-dim)
      - 'deterministic' / 'crc32': DeterministicDevelopmentProvider (CRC32, 128-dim)
    """
    provider_type = os.getenv("EMBEDDING_PROVIDER", "sentence_transformers").lower().strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()

    if provider_type == "openai" and openai_key:
        return OpenAIEmbeddingProvider(api_key=openai_key)
    elif provider_type in ("deterministic", "crc32"):
        return DeterministicDevelopmentProvider(dim=128)
    elif provider_type in ("sentence_transformers", "local", "local_semantic"):
        try:
            return SentenceTransformerEmbeddingProvider(
                model_name=os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
            )
        except Exception as err:
            logger.warning(f"Failed initializing SentenceTransformer: {err}. Falling back to DeterministicDevelopmentProvider.")
            return DeterministicDevelopmentProvider(dim=384)
    else:
        # Default to sentence_transformers with safe fallback
        try:
            return SentenceTransformerEmbeddingProvider()
        except Exception:
            return DeterministicDevelopmentProvider(dim=128)
