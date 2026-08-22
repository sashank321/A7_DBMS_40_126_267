import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
import sys

PG_HOST = os.getenv("POSTGRES_HOST", "localhost")
PG_PORT = int(os.getenv("POSTGRES_PORT", 5432))
PG_USER = os.getenv("POSTGRES_USER", "postgres")
PG_PASSWORD = os.getenv("POSTGRES_PASSWORD", "Sashank@123")
PG_DB = os.getenv("POSTGRES_DB", "knowledgesphere_db")

def init_database():
    print(f"Connecting to PostgreSQL at {PG_HOST}:{PG_PORT}...")
    conn = psycopg2.connect(host=PG_HOST, port=PG_PORT, user=PG_USER, password=PG_PASSWORD, dbname="postgres")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (PG_DB,))
    if not cur.fetchone():
        cur.execute(f"CREATE DATABASE {PG_DB};")
        print(f"Created database: {PG_DB}")
    else:
        print(f"Database already exists: {PG_DB}")
    cur.close()
    conn.close()

    conn = psycopg2.connect(host=PG_HOST, port=PG_PORT, user=PG_USER, password=PG_PASSWORD, dbname=PG_DB)
    cur = conn.cursor()

    sql_files = [
        os.path.join("database", "sql", "college", "01_schema.sql"),
        os.path.join("database", "sql", "college", "02_sample_data.sql"),
        os.path.join("database", "sql", "extensions", "01_advanced_features.sql")
    ]

    for sf in sql_files:
        print(f"Executing {sf}...")
        with open(sf, "r", encoding="utf-8") as f:
            cur.execute(f.read())
        conn.commit()

    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    tables = [row[0] for row in cur.fetchall()]
    print(f"\nSuccessfully verified {len(tables)} tables/views in {PG_DB}:")
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM {t};")
        cnt = cur.fetchone()[0]
        print(f"  - {t}: {cnt} rows")

    cur.close()
    conn.close()
    print("\nPostgreSQL initialization and extensions complete!")

if __name__ == "__main__":
    init_database()
