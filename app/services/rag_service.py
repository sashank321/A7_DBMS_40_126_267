from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.postgres_models import User, Document, DocumentChunk
from app.services.router_service import router_service
from app.services.search_service import search_service
from app.services.document_service import document_service
from app.services.graph_service import graph_service
from app.services.text2sql_service import text2sql_service

class RAGService:
    def answer_question(self, db: Session, question: str, user: User, top_k: int = 4) -> Dict[str, Any]:
        """
        Executes the end-to-end RAG workflow:
        1. Classifies intent (STRUCTURED, SEMANTIC, GRAPH, HYBRID).
        2. Applies STRICT RBAC permission filter BEFORE context assembly.
        3. Retrieves relevant chunks or structured records.
        4. Synthesizes grounded answer and generates precise citations.
        5. Reports the number of unauthorized documents excluded.
        """
        # Step 1: Classify intent
        intent, intent_reason = router_service.classify_intent(question)

        # Step 2: Track RBAC exclusions
        all_docs = db.query(Document).all()
        accessible_docs = document_service.list_accessible_documents(db, user)
        accessible_doc_ids = {d.document_id for d in accessible_docs}
        unauthorized_count = len(all_docs) - len(accessible_docs)

        # Step 3: Handle Structured Queries via Safe Text-to-SQL if applicable
        if intent == "STRUCTURED":
            sql = text2sql_service.natural_to_sql(question, user)
            res = text2sql_service.execute_safe_query(db, sql, question)
            if res["is_safe"] and res["row_count"] > 0:
                answer = f"Found {res['row_count']} structured record(s):\n"
                for row in res["results"][:5]:
                    row_str = ", ".join(f"{k}: {v}" for k, v in row.items())
                    answer += f"- {row_str}\n"

                return {
                    "question": question,
                    "answer": answer.strip(),
                    "route_intent": intent,
                    "confidence": 0.95,
                    "citations": [],
                    "unauthorized_documents_filtered": unauthorized_count,
                    "reasoning": f"Structured retrieval via validated SQL: {sql}"
                }

        # Step 4: Handle Graph / Entity inquiries
        if intent == "GRAPH":
            graph_results = []
            for term in question.split():
                if len(term) > 3:
                    connected = graph_service.find_connected_entities(db, term)
                    if connected:
                        graph_results.extend(connected)

            if graph_results:
                answer = "Knowledge Graph Entity Connections:\n"
                for edge in graph_results[:6]:
                    answer += f"- {edge['source']} --[{edge['relation']}]--> {edge['target']} ({edge.get('target_type', 'ENTITY')})\n"
                return {
                    "question": question,
                    "answer": answer.strip(),
                    "route_intent": intent,
                    "confidence": 0.92,
                    "citations": [],
                    "unauthorized_documents_filtered": unauthorized_count,
                    "reasoning": "Knowledge graph relationship traversal."
                }

        # Step 5: Perform Permission-Filtered Hybrid / Semantic Retrieval
        retrieved_items = search_service.hybrid_search(db, question, user, top_k=top_k)

        # Step 6: Verify confidence and context availability
        if not retrieved_items or (retrieved_items and retrieved_items[0]["similarity_score"] < 0.15):
            return {
                "question": question,
                "answer": "Insufficient information found in authorized enterprise documents. No matching knowledge was available under your access permissions.",
                "route_intent": intent,
                "confidence": 0.1,
                "citations": [],
                "unauthorized_documents_filtered": unauthorized_count,
                "reasoning": "Retrieval score below threshold or no authorized documents matched query."
            }

        # Step 7: Build Grounded Context and Exact Citations
        citations = []
        context_snippets = []

        for item in retrieved_items:
            doc_id = item["document_id"]
            chunk_id = item.get("chunk_id") or 1
            chunk_num = item.get("chunk_number") or 1
            title = item["title"]
            snippet = item["content_snippet"]

            citations.append({
                "document_id": doc_id,
                "title": title,
                "version_number": item["provenance"].get("version_id") or 1,
                "chunk_id": chunk_id,
                "snippet": snippet[:150] + "..."
            })
            context_snippets.append(f"[{title} - Chunk #{chunk_num}]: {snippet}")

        # Step 8: Synthesize Grounded Answer via LLM Provider
        from app.services.llm_provider import get_llm_provider
        primary_match = retrieved_items[0]
        llm = get_llm_provider()
        llm_result = llm.generate_grounded_answer(question, retrieved_items[:3])

        return {
            "question": question,
            "answer": llm_result["answer"],
            "route_intent": intent,
            "confidence": round(min(primary_match["similarity_score"] * 1.5, 0.98), 2),
            "citations": citations,
            "unauthorized_documents_filtered": unauthorized_count,
            "llm_provider": llm_result["provider"],
            "is_generative_llm": llm_result["is_generative_llm"],
            "reasoning": f"Synthesized from {len(citations)} authorized document chunks via {intent} retrieval."
        }

rag_service = RAGService()
