import psycopg2
import os

PG_HOST = os.getenv("POSTGRES_HOST", "localhost")
PG_PORT = int(os.getenv("POSTGRES_PORT", 5432))
PG_USER = os.getenv("POSTGRES_USER", "postgres")
PG_PASSWORD = os.getenv("POSTGRES_PASSWORD", "Sashank@123")
PG_DB = os.getenv("POSTGRES_DB", "knowledgesphere_db")

def run_queries():
    conn = psycopg2.connect(host=PG_HOST, port=PG_PORT, user=PG_USER, password=PG_PASSWORD, dbname=PG_DB)
    cur = conn.cursor()

    query_file = os.path.join("dbms project", "dbms", "03_test_queries.sql")
    with open(query_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    # Split by semicolon, filter comments and empty statements
    statements = [s.strip() for s in sql_content.split(";") if s.strip()]
    passed = 0
    for idx, stmt in enumerate(statements, 1):
        try:
            cur.execute(stmt)
            if cur.description:
                rows = cur.fetchall()
                print(f"Query {idx}: OK (returned {len(rows)} rows)")
            else:
                conn.commit()
                print(f"Query {idx}: OK (statement executed)")
            passed += 1
        except Exception as e:
            print(f"Query {idx}: FAILED -> {e}")
            conn.rollback()

    print(f"\nCompleted {passed}/{len(statements)} queries successfully.")
    cur.close()
    conn.close()

if __name__ == "__main__":
    run_queries()
