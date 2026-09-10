import os
import pytest
import numpy as np
from app.services.embedding_provider import (
    SentenceTransformerEmbeddingProvider,
    DeterministicDevelopmentProvider,
    get_embedding_provider
)
from app.services.embedding_service import embedding_service
from app.services.llm_provider import LocalLLMProvider, LocalGroundedSynthesizer

def test_sentence_transformer_provider_properties():
    """Verify that SentenceTransformerEmbeddingProvider produces normalized 384-dim vectors."""
    provider = SentenceTransformerEmbeddingProvider(model_name="all-MiniLM-L6-v2")
    assert provider.get_dimensions() == 384
    assert "SentenceTransformers" in provider.get_provider_name()

    vec = provider.get_embedding("Enterprise knowledge retrieval and vector search.")
    assert len(vec) == 384
    norm = np.linalg.norm(np.array(vec))
    assert abs(norm - 1.0) < 1e-3

def test_semantic_similarity_conceptual_discrimination():
    """
    Verifies that the pretrained embedding model distinguishes conceptual semantics
    even without identical keyword overlap.
    """
    provider = SentenceTransformerEmbeddingProvider(model_name="all-MiniLM-L6-v2")
    
    vec_sql = provider.get_embedding("PostgreSQL relational database schema design with primary and foreign keys")
    vec_db = provider.get_embedding("Relational database tables, normalization, and SQL constraints")
    vec_unrelated = provider.get_embedding("Grandmother's homemade Italian chocolate cake dessert recipe")

    sim_related = embedding_service.cosine_similarity(vec_sql, vec_db)
    sim_unrelated = embedding_service.cosine_similarity(vec_sql, vec_unrelated)

    # Conceptual similarity should be high, unrelated should be near 0
    assert sim_related > 0.45, f"Expected high similarity for database concepts, got {sim_related}"
    assert sim_unrelated < 0.20, f"Expected low similarity for unrelated text, got {sim_unrelated}"
    assert sim_related - sim_unrelated > 0.35, "Semantic separation should exceed 0.35"

def test_end_to_end_ingestion_storage_and_semantic_retrieval(client, admin_headers):
    """
    Verifies end-to-end flow:
    Ingestion -> Chunking -> 384-dim Embedding -> PostgreSQL Storage -> Semantic Search
    """
    # 1. Ingest document
    create_res = client.post(
        "/api/v1/documents",
        data={
            "title": "Quantum Fault Tolerant Architecture",
            "description": "Research paper on quantum error correction and decoherence prevention.",
            "department_id": 3,
            "category_id": 3,
            "tags": "Quantum, Computing, FaultTolerance",
            "content": (
                "Quantum computing architectures require continuous syndrome measurements "
                "to suppress environmental decoherence. Surface codes provide fault tolerance "
                "by encoding logical qubits into a lattice of physical superconducting qubits."
            )
        },
        headers=admin_headers
    )
    assert create_res.status_code == 201
    doc_id = create_res.json()["document_id"]

    try:
        # 2. Search using semantically related query with NO exact overlapping words
        search_res = client.post(
            "/api/v1/search",
            json={
                "query": "superconducting qubit noise suppression and error protection",
                "top_k": 3
            },
            headers=admin_headers
        )
        assert search_res.status_code == 200
        results = search_res.json()["results"]
        assert len(results) > 0

        matched_titles = [r["title"] for r in results]
        assert "Quantum Fault Tolerant Architecture" in matched_titles
        top_match = next(r for r in results if r["title"] == "Quantum Fault Tolerant Architecture")
        assert top_match["similarity_score"] > 0.40

    finally:
        # 3. Clean up
        client.delete(f"/api/v1/documents/{doc_id}", headers=admin_headers)

def test_embedding_provider_env_switching(monkeypatch):
    """Verify provider switching via EMBEDDING_PROVIDER environment variable."""
    # Deterministic fallback
    monkeypatch.setenv("EMBEDDING_PROVIDER", "deterministic")
    provider_det = get_embedding_provider()
    assert isinstance(provider_det, DeterministicDevelopmentProvider)
    assert provider_det.get_dimensions() == 128

    # SentenceTransformers
    monkeypatch.setenv("EMBEDDING_PROVIDER", "sentence_transformers")
    provider_st = get_embedding_provider()
    assert isinstance(provider_st, SentenceTransformerEmbeddingProvider)
    assert provider_st.get_dimensions() == 384

def test_local_llm_provider_offline_fallback():
    """
    Verifies that LocalLLMProvider cleanly falls back to LocalGroundedSynthesizer
    when the local LLM daemon (e.g. Ollama) is not running.
    """
    offline_llm = LocalLLMProvider(base_url="http://localhost:59999/v1", model="llama3")
    assert offline_llm.is_available() is False

    chunks = [{
        "title": "Security Guidelines",
        "chunk_number": 1,
        "content_snippet": "All employees must use multi-factor authentication for SSH and VPN access."
    }]
    res = offline_llm.generate_grounded_answer("How do we access SSH?", chunks)
    assert "answer" in res
    assert "Security Guidelines" in res["answer"]
    assert res["is_generative_llm"] is False
    assert "Extractive Grounded Retrieval" in res["answer"]
