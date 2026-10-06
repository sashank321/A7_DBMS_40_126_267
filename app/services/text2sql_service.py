import re
import time
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
import sqlglot
from sqlglot import exp
from app.services.document_service import document_service
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
    def validate_sql(self, sql_query: str) -> tuple[bool, str]:
        """Parse the complete query before allowing a bounded read-only SELECT."""
        try:
            statements = sqlglot.parse(sql_query, read="postgres")
        except sqlglot.errors.ParseError:
            return False, "Security Violation: Invalid SQL syntax."
        if len(statements) != 1 or not isinstance(statements[0], exp.Select):
            return False, "Security Violation: Only one SELECT query is permitted."
        query = statements[0]
        unsafe = (exp.Insert, exp.Update, exp.Delete, exp.Create, exp.Drop, exp.Alter, exp.Command, exp.Into, exp.Lock)
        if any(isinstance(node, unsafe) for node in query.walk()):
            return False, "Security Violation: Mutating statements are prohibited."
        for table in query.find_all(exp.Table):
            if table.name.lower() not in ALLOWED_TABLES or table.catalog or table.db not in ("", "public"):
                return False, "Security Violation: Query references an unapproved table or schema."
        for column in query.find_all(exp.Column):
            if column.name.lower() in {"password", "password_hash"}:
                return False, "Security Violation: Credentials cannot be queried."
        if any(t.name.lower() == "users" for t in query.find_all(exp.Table)):
            if any(not isinstance(star.parent, exp.Count) for star in query.find_all(exp.Star)):
                return False, "Security Violation: Select specific public user fields."
        allowed_functions = {"COUNT", "SUM", "AVG", "MIN", "MAX", "COALESCE", "LOWER", "UPPER", "LENGTH", "ROUND"}
        for function in query.find_all(exp.Func):
            name = function.name.upper() if isinstance(function, exp.Anonymous) else function.sql_name().upper()
            if name not in allowed_functions:
                return False, "Security Violation: This SQL function is not permitted."
        return True, "Query is safe for execution."

    def _scope_sql(self, sql_query: str, db: Session, user: User) -> str:
        query = sqlglot.parse_one(sql_query, read="postgres")
        ids = [int(d.document_id) for d in document_service.list_accessible_documents(db, user)]
        id_list = ",".join(map(str, ids)) or "NULL"
        scoped_docs = {"documents", "document_versions", "document_tags", "v_document_overview"}
        for table in list(query.find_all(exp.Table)):
            name = table.name.lower()
            condition = None
            projection = "*"
            if name == "users":
                projection = "user_id, name, email, role_id, department_id, created_at"
                if user.role.role_name == "Employee":
                    condition = f"user_id = {int(user.user_id)}"
            elif user.role.role_name != "Admin" and name in scoped_docs:
                condition = f"document_id IN ({id_list})"
            elif user.role.role_name != "Admin" and name in {"audit_logs", "v_user_access_matrix"}:
                condition = f"user_id = {int(user.user_id)} AND document_id IN ({id_list})"
            elif user.role.role_name != "Admin" and name == "tags":
                condition = f"tag_id IN (SELECT tag_id FROM document_tags WHERE document_id IN ({id_list}))"
            if condition or name == "users":
                inner_sql = f"SELECT {projection} FROM {name}"
                if condition:
                    inner_sql += f" WHERE {condition}"
                table.replace(sqlglot.parse_one(inner_sql, read="postgres").subquery(alias=table.alias_or_name))
        return query.sql(dialect="postgres")

    def natural_to_sql(self, natural_query: str, user: User) -> str:
        """Translates natural language questions to compliant PostgreSQL queries."""
        q = natural_query.strip().lower()
        if re.match(r"^(select|with|insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|execute)\b", q):
            return natural_query.strip()

        # Query 1: Count of documents by department
        if "department" in q and ("count" in q or "how many" in q or "number of" in q or "total" in q):
            return """
                SELECT d.department_name, COUNT(doc.document_id) AS total_documents
                FROM departments d
                LEFT JOIN documents doc ON d.department_id = doc.department_id
                GROUP BY d.department_name
                ORDER BY total_documents DESC;
            """.strip()

        # Query 2: Users in departments
        if "user" in q and ("department" in q or "works in" in q or "role" in q):
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

    def execute_safe_query(self, db: Session, sql_query: str, natural_query: str, user: User = None) -> Dict[str, Any]:
        """Safely executes validated SQL and returns structured results."""
        clean_sql = sql_query.strip().rstrip(";").strip()
        is_safe, msg = self.validate_sql(clean_sql)
        if is_safe and user is None:
            is_safe, msg = False, "An authenticated user is required for permission-scoped SQL."
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
            clean_sql = self._scope_sql(clean_sql, db, user)
            db.execute(text("SET TRANSACTION READ ONLY"))
            db.execute(text("SET LOCAL statement_timeout = 3000"))
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
