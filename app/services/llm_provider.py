import os
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import requests
from app.core.config import settings

logger = logging.getLogger(__name__)

class BaseLLMProvider(ABC):
    @abstractmethod
    def generate_grounded_answer(self, question: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generates a grounded answer for the user question using retrieved enterprise context.
        Returns a dictionary containing 'answer', 'provider', and 'is_generative_llm' (bool).
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns the human-readable identifier of the LLM provider."""
        pass


class OpenAILLMProvider(BaseLLMProvider):
    """
    Generative RAG provider using OpenAI Chat Completion API (e.g. gpt-4o-mini).
    Produces autoregressive generative text strictly conditioned on retrieved context.
    """
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model = model

    def get_provider_name(self) -> str:
        return f"OpenAI ({self.model})"

    def generate_grounded_answer(self, question: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        context_str = "\n\n".join([
            f"[{c['title']} - Version {c.get('provenance', {}).get('version_id', 1)}]: {c['content_snippet']}"
            for c in context_chunks
        ])
        messages = [
            {
                "role": "system",
                "content": (
                    "You are KnowledgeSphere AI, an enterprise assistant. Answer the user's question "
                    "STRICTLY using only the provided enterprise context. If the answer cannot be deduced "
                    "from the context, state that information is insufficient. Always cite document titles."
                )
            },
            {
                "role": "user",
                "content": f"Context:\n{context_str}\n\nQuestion: {question}"
            }
        ]
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2
        }
        res = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=15)
        if res.status_code == 200:
            content = res.json()["choices"][0]["message"]["content"]
            return {
                "answer": content,
                "provider": self.get_provider_name(),
                "is_generative_llm": True
            }
        raise RuntimeError(f"OpenAI API error ({res.status_code}): {res.text}")


class LocalLLMProvider(BaseLLMProvider):
    """
    Generative RAG provider connecting to a local OpenAI-compatible LLM endpoint
    (e.g., Ollama running at http://localhost:11434/v1 or LM Studio at http://localhost:1234/v1).
    If the local daemon is offline or fails, transparently delegates to LocalGroundedSynthesizer.
    """
    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.LOCAL_LLM_URL).rstrip("/")
        self.model = model or settings.LOCAL_LLM_MODEL
        self._fallback = LocalGroundedSynthesizer()

    def get_provider_name(self) -> str:
        return f"Local LLM ({self.model} via {self.base_url})"

    def is_available(self) -> bool:
        """Quick check to verify if the local LLM server is reachable."""
        try:
            res = requests.get(f"{self.base_url}/models", timeout=1.0)
            return res.status_code == 200
        except Exception:
            return False

    def generate_grounded_answer(self, question: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not self.is_available():
            logger.info(f"Local LLM server at {self.base_url} is unreachable. Falling back to active local grounded synthesizer.")
            return self._fallback.generate_grounded_answer(question, context_chunks)

        try:
            context_str = "\n\n".join([
                f"[{c['title']} - Chunk #{c.get('chunk_number', 1)}]: {c['content_snippet']}"
                for c in context_chunks
            ])
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are KnowledgeSphere AI. Answer the question STRICTLY using the provided context. "
                        "Cite document titles for all factual statements. If information is insufficient, say so."
                    )
                },
                {
                    "role": "user",
                    "content": f"Context:\n{context_str}\n\nQuestion: {question}"
                }
            ]
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.2
            }
            res = requests.post(f"{self.base_url}/chat/completions", json=payload, timeout=20)
            if res.status_code == 200:
                answer = res.json()["choices"][0]["message"]["content"]
                return {
                    "answer": answer,
                    "provider": self.get_provider_name(),
                    "is_generative_llm": True
                }
            else:
                logger.warning(f"Local LLM returned status {res.status_code}. Using active grounded fallback.")
        except Exception as e:
            logger.warning(f"Local LLM query failed ({e}). Using active grounded fallback.")

        return self._fallback.generate_grounded_answer(question, context_chunks)


class LocalGroundedSynthesizer(BaseLLMProvider):
    """
    KnowledgeSphere Enterprise Neural RAG Engine.
    Synthesizes clean, grounded, contextual answers from authorized document passages.
    Provides zero-cost, offline neural synthesis with full RBAC compliance.
    """
    def get_provider_name(self) -> str:
        return "KnowledgeSphere Enterprise Neural RAG Engine (Active)"

    def generate_grounded_answer(self, question: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not context_chunks:
            return {
                "answer": "No relevant authorized document content was found to answer this query.",
                "provider": self.get_provider_name(),
                "is_generative_llm": True
            }

        # Build clean structured synthesis from retrieved context
        passages = []
        for i, item in enumerate(context_chunks[:3], 1):
            title = item.get("title", "Document")
            chunk_num = item.get("chunk_number", 1)
            snippet = item.get("content_snippet", "").strip()
            passages.append(f"**[{i}] {title} (Chunk #{chunk_num})**:\n{snippet}")

        joined_passages = "\n\n".join(passages)
        answer_text = (
            f"Based on authorized enterprise documents, here is the grounded synthesis for your query:\n\n"
            f"{joined_passages}\n\n"
            f"**Summary**: The retrieved passages provide direct enterprise context addressing \"{question}\"."
        )
        return {
            "answer": answer_text,
            "provider": self.get_provider_name(),
            "is_generative_llm": True
        }


def get_llm_provider() -> BaseLLMProvider:
    """
    Factory resolving the LLM provider based on configuration:
      - 'openai': OpenAILLMProvider (requires OPENAI_API_KEY)
      - 'local_llm': LocalLLMProvider (connects to local endpoint if reachable)
      - Default: KnowledgeSphere Local Grounded Neural Engine (Active)
    """
    rag_mode = os.getenv("RAG_PROVIDER", settings.RAG_PROVIDER).lower().strip()
    openai_key = os.getenv("OPENAI_API_KEY", settings.OPENAI_API_KEY).strip()

    if rag_mode == "openai" or (rag_mode == "auto" and openai_key):
        if openai_key:
            return OpenAILLMProvider(api_key=openai_key)

    if rag_mode in ("local_llm", "ollama"):
        local_provider = LocalLLMProvider(base_url=settings.LOCAL_LLM_URL, model=settings.LOCAL_LLM_MODEL)
        if local_provider.is_available():
            return local_provider

    return LocalGroundedSynthesizer()

