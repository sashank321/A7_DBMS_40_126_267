import os
import sys
import psycopg2
from pymongo import MongoClient

PG_HOST = os.getenv("POSTGRES_HOST", "localhost")
PG_PORT = int(os.getenv("POSTGRES_PORT", 5432))
PG_USER = os.getenv("POSTGRES_USER", "postgres")
PG_PASSWORD = os.getenv("POSTGRES_PASSWORD", "Sashank@123")
PG_DB = os.getenv("POSTGRES_DB", "knowledgesphere_db")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB = os.getenv("MONGO_DB", "knowledgesphere_nosql")

def audit():
    print("=" * 60)
    print("AUDIT 1: POSTGRESQL ENGINE & SCHEMA INTEGRITY")
    print("=" * 60)
    conn = psycopg2.connect(host=PG_HOST, port=PG_PORT, user=PG_USER, password=PG_PASSWORD, dbname=PG_DB)
    cur = conn.cursor()

    # Check pgvector extension
    cur.execute("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';")
    ext = cur.fetchall()
    print(f"pgvector extension installed: {bool(ext)} (Found: {ext})")

    # List all tables and row counts
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """)
    tables = [r[0] for r in cur.fetchall()]
    print(f"Total Base Tables ({len(tables)}):")
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM {t};")
        cnt = cur.fetchone()[0]
        print(f"  - {t}: {cnt} rows")

    # List Views
    cur.execute("""
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    views = [r[0] for r in cur.fetchall()]
    print(f"\nTotal Views ({len(views)}):")
    for v in views:
        cur.execute(f"SELECT COUNT(*) FROM {v};")
        cnt = cur.fetchone()[0]
        print(f"  - {v}: {cnt} rows")

    # Check Constraints
    cur.execute("""
        SELECT conname, contype, conrelid::regclass 
        FROM pg_constraint 
        WHERE connamespace = 'public'::regnamespace
        ORDER BY conrelid::regclass::text, conname;
    """)
    constraints = cur.fetchall()
    print(f"\nTotal Constraints ({len(constraints)}):")
    pks = [c for c in constraints if c[1] == 'p']
    fks = [c for c in constraints if c[1] == 'f']
    uqs = [c for c in constraints if c[1] == 'u']
    chks = [c for c in constraints if c[1] == 'c']
    print(f"  - Primary Keys (contype 'p'): {len(pks)}")
    print(f"  - Foreign Keys (contype 'f'): {len(fks)}")
    print(f"  - Unique Constraints (contype 'u'): {len(uqs)}")
    print(f"  - Check Constraints (contype 'c'): {len(chks)}")

    # Run EXPLAIN ANALYZE on important queries
    print("\nEXPLAIN ANALYZE on v_user_access_matrix:")
    cur.execute("EXPLAIN ANALYZE SELECT * FROM v_user_access_matrix;")
    for row in cur.fetchall()[:3]:
        print(" ", row[0])

    print("\nEXPLAIN ANALYZE on v_audit_analytics (Window Functions):")
    cur.execute("EXPLAIN ANALYZE SELECT * FROM v_audit_analytics;")
    for row in cur.fetchall()[:3]:
        print(" ", row[0])

    # Inspect document_embeddings column types
    cur.execute("""
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'document_embeddings';
    """)
    cols = cur.fetchall()
    print("\ndocument_embeddings column definitions:")
    for c in cols:
        print(f"  - {c[0]}: {c[1]} (udt: {c[2]})")

    cur.close()
    conn.close()

    print("\n" + "=" * 60)
    print("AUDIT 2: MONGODB NOSQL CONNECTION & AGGREGATION")
    print("=" * 60)
    m_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    m_db = m_client[MONGO_DB]
    print("MongoDB ping:", m_db.command("ping"))
    print("Collections in", MONGO_DB, ":", m_db.list_collection_names())

    # Insert test document
    ins_res = m_db.audit_test.insert_one({"test": "audit_verification", "status": "active"})
    print("Insert test ID:", ins_res.inserted_id)

    # Read test document
    doc = m_db.audit_test.find_one({"_id": ins_res.inserted_id})
    print("Read test verification:", doc["test"] == "audit_verification")

    # Update test document
    up_res = m_db.audit_test.update_one({"_id": ins_res.inserted_id}, {"$set": {"status": "verified"}})
    print("Update test modified count:", up_res.modified_count)

    # Execute Aggregation Pipeline
    pipeline = [
        {"$group": {"_id": "$action_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    agg_res = list(m_db.activity_logs.aggregate(pipeline))
    print("Real Aggregation Pipeline Results on activity_logs:")
    for r in agg_res:
        print("  -", r)

    # Clean up test collection
    m_db.audit_test.drop()
    m_client.close()

if __name__ == "__main__":
    audit()
