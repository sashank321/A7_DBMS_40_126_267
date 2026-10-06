import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import psycopg2
from psycopg2 import sql
from app.core.config import settings

def init_database():
    credentials = dict(host=settings.POSTGRES_HOST, port=settings.POSTGRES_PORT, user=settings.POSTGRES_USER, password=settings.POSTGRES_PASSWORD)
    admin = psycopg2.connect(**credentials, dbname="postgres")
    admin.autocommit = True
    with admin.cursor() as cur:
        cur.execute("SELECT 1 FROM pg_database WHERE datname=%s", (settings.POSTGRES_DB,))
        if not cur.fetchone():
            cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(settings.POSTGRES_DB)))
    admin.close()
    conn = psycopg2.connect(**credentials, dbname=settings.POSTGRES_DB)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT to_regclass('public.roles')")
            if cur.fetchone()[0]:
                print("Application schema already exists; initialization skipped to preserve data.")
                return
            cur.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")
            if cur.fetchone()[0]:
                raise RuntimeError("Database contains another schema. Use an empty database for initial setup.")
            root = Path(__file__).resolve().parents[1]
            for relative in ["database/sql/college/01_schema.sql", "database/sql/college/02_sample_data.sql", "database/sql/extensions/01_advanced_features.sql"]:
                cur.execute((root / relative).read_text(encoding="utf-8"))
        conn.commit()
        print(f"Initialized {settings.POSTGRES_DB}.")
    finally:
        conn.close()

if __name__ == "__main__":
    init_database()
