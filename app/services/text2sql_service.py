import re
import time
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.postgres_models import User

# Strict Whitelist of Permitted Tables and Views
ALLOWED_TABLES = {
    "roles", "departments", "users", "categories", "documents",
    "tags", "document_tags", "document_versions", "audit_logs",
    "v_document_overview", "v_user_access_matrix"
}

FORBIDDEN_KEYWORDS = [
    r"\binsert\b", r"\bupdate\b", r"\bdelete\b", r"\bdrop\b",
    r"\balter\b", r"\btruncate\b", r"\bgrant\b", r"\brevoke\b",
    r"\bexecute\b", r"\bexec\b", r"\bcreate\b", r"\bcopy\b",
    r";", r"--", r"/\*", r"\bpg_", r"\binformation_schema\b"
]

class Text2SQLService:
    def validate_sql(self, sql_query: str) -> (bool, str):
        """Validates that the SQL query is safe, read-only SELECT, and uses only permitted tables."""
        clean_sql = sql_query.strip().rstrip(";").strip()

        # 1. Must start with SELECT
        if not clean_sql.upper().startswith("SELECT"):
            return False, "Security Violation: Only SELECT queries are permitted."

        # 2. Check for forbidden keywords and injection markers
        for kw in FORBIDDEN_KEYWORDS:
            if re.search(kw, clean_sql, re.IGNORECASE):
                return False, f"Security Violation: Query contains prohibited token '{kw}'."

        # 3. Extract table names and check against whitelist
        table_matches = re.findall(r"\bFROM\s+([a-zA-Z_]+)|\bJOIN\s+([a-zA-Z_]+)", clean_sql, re.IGNORECASE)
        found_tables = set()
        for m in table_matches:
            tbl = (m[0] or m[1]).lower()
            found_tables.add(tbl)

        for tbl in found_tables:
            if tbl not in ALLOWED_TABLES:
                return False, f"Security Violation: Table or view '{tbl}' is not in the approved query whitelist."

        return True, "Query is safe for execution."

    def natural_to_sql(self, natural_query: str, user: User) -> str:
        """Translates natural language questions to compliant PostgreSQL queries."""
        q = natural_query.lower()

        # Query 1: Count of documents by department
        if "department" in q and ("count" in q or "how many" in q or "number of" in q):
            return """
                SELECT d.department_name, COUNT(doc.document_id) AS total_documents
                FROM departments d
                LEFT JOIN documents doc ON d.department_id = doc.department_id
                GROUP BY d.department_name
                ORDER BY total_documents DESC;
            """.strip()

        # Query 2: Users in departments
        if "user" in q and ("department" in q or "works in" in q):
            return """
                SELECT u.name AS user_name, u.email, d.department_name, r.role_name
                FROM users u
                JOIN departments d ON u.department_id = d.department_id
                JOIN roles r ON u.role_id = r.role_id
                ORDER BY d.department_name, u.name;
            """.strip()

        # Query 3: Documents by category
        if "category" in q and ("documents" in q or "count" in q):
            return """
                SELECT c.category_name, COUNT(doc.document_id) AS document_count
                FROM categories c
                LEFT JOIN documents doc ON c.category_id = doc.category_id
                GROUP BY c.category_name
                ORDER BY document_count DESC;
            """.strip()

        # Query 4: Most active users (audit logs)
        if "active" in q or "activity" in q or "audit" in q:
            return """
                SELECT u.name AS user_name, COUNT(a.log_id) AS action_count
                FROM users u
                JOIN audit_logs a ON u.user_id = a.user_id
                GROUP BY u.name
                ORDER BY action_count DESC
                LIMIT 5;
            """.strip()

        # Query 5: Documents with version count
        if "version" in q or "overview" in q:
            return """
                SELECT document_id, title, department_name, category_name, latest_version_number, total_tags
                FROM v_document_overview
                ORDER BY document_id;
            """.strip()

        # Query 6: List all documents owned by Engineering employees
        if "engineering" in q and "document" in q:
            return """
                SELECT doc.document_id, doc.title, u.name AS uploader, d.department_name
                FROM documents doc
                JOIN users u ON doc.uploaded_by = u.user_id
                JOIN departments d ON doc.department_id = d.department_id
                WHERE d.department_name = 'Engineering'
                ORDER BY doc.document_id;
            """.strip()

        # Default query
        return """
            SELECT document_id, title, department_name, category_name
            FROM v_document_overview
            ORDER BY document_id
            LIMIT 10;
        """.strip()

    def execute_safe_query(self, db: Session, sql_query: str, natural_query: str) -> Dict[str, Any]:
        """Safely executes validated SQL and returns structured results."""
        clean_sql = sql_query.strip().rstrip(";").strip()
        is_safe, msg = self.validate_sql(clean_sql)
        if not is_safe:
            return {
                "natural_query": natural_query,
                "generated_sql": sql_query,
                "is_safe": False,
                "status": "REJECTED",
                "row_count": 0,
                "columns": [],
                "results": [],
                "explanation": msg,
                "execution_time_ms": 0.0
            }

        start_time = time.time()
        try:
            # Set statement timeout to 3000ms for protection against resource exhaustion
            db.execute(text("SET statement_timeout = 3000;"))
            result = db.execute(text(clean_sql))
            rows = result.fetchall()
            cols = list(result.keys()) if result.keys() else []
            elapsed = round((time.time() - start_time) * 1000, 2)

            data = []
            for r in rows:
                data.append(dict(zip(cols, r)))

            return {
                "natural_query": natural_query,
                "generated_sql": sql_query,
                "is_safe": True,
                "status": "SUCCESS",
                "row_count": len(data),
                "columns": cols,
                "results": data,
                "explanation": "Query successfully validated and executed against PostgreSQL.",
                "execution_time_ms": elapsed
            }
        except Exception as e:
            elapsed = round((time.time() - start_time) * 1000, 2)
            db.rollback()
            return {
                "natural_query": natural_query,
                "generated_sql": sql_query,
                "is_safe": False,
                "status": "EXECUTION_ERROR",
                "row_count": 0,
                "columns": [],
                "results": [],
                "explanation": f"PostgreSQL Execution Error: {str(e)}",
                "execution_time_ms": elapsed
            }

text2sql_service = Text2SQLService()
