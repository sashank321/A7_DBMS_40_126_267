import re
from typing import Tuple, Dict, Any

class RouterService:
    def classify_intent(self, query: str) -> Tuple[str, str]:
        """
        Deterministically classifies query intent into:
        - STRUCTURED: Aggregates, counts, numerical metrics, schema tables.
        - GRAPH: Relationships, connections, reporting lines, associations.
        - SEMANTIC: Unstructured explanations, policies, guidelines.
        - HYBRID: Combination of metadata filtering + conceptual semantic search.

        Returns (intent, explanation).
        """
        q = query.lower().strip()

        # 1. Check for Structured / SQL intent
        structured_patterns = [
            r"\b(how many|count of|total number of|average|sum of|min|max)\b",
            r"\b(list all users|list all departments|show all categories|list all roles)\b",
            r"\b(user_id|department_id|role_id|category_id)\b",
            r"\b(who uploaded the most|active users|number of documents)\b"
        ]
        for pattern in structured_patterns:
            if re.search(pattern, q):
                return "STRUCTURED", f"Query requests numerical aggregation or tabular structured data matching pattern '{pattern}'"

        # 2. Check for Graph / Entity Relationship intent
        graph_patterns = [
            r"\b(connected to|who works in|who is connected|relationship between|depends on|owns)\b",
            r"\b(which entities|graph of|what does .* manage|who reports to)\b"
        ]
        for pattern in graph_patterns:
            if re.search(pattern, q):
                return "GRAPH", f"Query inquires about entity relationships, organizational links, or provenance matching pattern '{pattern}'"

        # 3. Check for Hybrid intent (combination of metadata entity like department/category with conceptual inquiry)
        metadata_entities = [r"\bengineering\b", r"\bfinance\b", r"\bhuman resources\b", r"\bhr\b", r"\blegal\b", r"\bmarketing\b"]
        semantic_keywords = [r"\bguideline\b", r"\bpolicy\b", r"\bbest practice\b", r"\barchitecture\b", r"\bstandard\b", r"\bexplain\b", r"\bwhat is\b", r"\bhow to\b"]

        has_meta = any(re.search(m, q) for m in metadata_entities)
        has_sem = any(re.search(s, q) for s in semantic_keywords)

        if has_meta and has_sem:
            return "HYBRID", "Query requires both relational department/category filtering and semantic text relevance matching."

        # 4. Check for Semantic intent
        if has_sem or any(w in q for w in ["about", "describe", "summary", "overview", "what does", "content of"]):
            return "SEMANTIC", "Query requests conceptual, unstructured textual explanation or policy information."

        # Default fallback: Hybrid ensures both relational context and text matching are considered
        return "HYBRID", "Standard hybrid search maximizing precision across structured attributes and semantic embeddings."

router_service = RouterService()
