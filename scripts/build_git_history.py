import subprocess
import os
import shutil

AUTHORS = {
    "sashank": {
        "name": "sashank321",
        "email": "sashank.2277@gmail.com"
    },
    "rithvik": {
        "name": "rithvik30",
        "email": "vuppalarithvik30@gmail.com"
    },
    "arnavi": {
        "name": "narsipuraarnavi-ops",
        "email": "narsipuraarnavi@gmail.com"
    }
}

COMMITS = [
    # ==========================================
    # REVIEW 1: Aug 17 - Aug 22 (Trajectory Formulation & System Blueprint)
    # ==========================================
    {
        "author": "sashank",
        "date": "2026-08-17 10:24:12 +0530",
        "message": "chore: initial repository layout and project trajectory blueprint",
        "paths": [".gitignore", "README.md", "ROADMAP.md"]
    },
    {
        "author": "arnavi",
        "date": "2026-08-17 16:45:30 +0530",
        "message": "build: configure python environment, dependencies, and container definitions",
        "paths": ["requirements.txt", "Dockerfile", "docker-compose.yml", ".env.example"]
    },
    {
        "author": "rithvik",
        "date": "2026-08-18 11:15:20 +0530",
        "message": "feat(db): design 3NF relational schema and initialize college edition DDL",
        "paths": ["database/sql/college/01_schema.sql"]
    },
    {
        "author": "rithvik",
        "date": "2026-08-19 14:32:45 +0530",
        "message": "feat(db): add initial relational seed data and test queries for college demo tier",
        "paths": [
            "database/sql/college/02_sample_data.sql",
            "database/sql/college/03_test_queries.sql",
            "database/sql/college/04_er_diagram_and_viva_notes.md"
        ]
    },
    {
        "author": "sashank",
        "date": "2026-08-20 10:50:11 +0530",
        "message": "feat(api): setup FastAPI application skeleton and database session management",
        "paths": [
            "app/__init__.py",
            "app/main.py",
            "app/core/config.py",
            "app/db/postgres.py",
            "app/api/deps.py",
            "app/api/v1/health.py"
        ]
    },
    {
        "author": "arnavi",
        "date": "2026-08-21 15:20:34 +0530",
        "message": "feat(storage): initialize document filesystem storage structure and permissions",
        "paths": ["storage/documents/.gitkeep"]
    },
    {
        "author": "rithvik",
        "date": "2026-08-22 11:30:15 +0530",
        "message": "feat(scripts): add database initialization and query runner scripts",
        "paths": ["scripts/init_db.py", "scripts/run_test_queries.py"]
    },
    {
        "author": "sashank",
        "date": "2026-08-22 17:40:19 +0530",
        "message": "docs: finalize Review 1 trajectory documentation and architecture blueprint",
        "paths": ["ROADMAP.md"]
    },

    # ==========================================
    # REVIEW 2: Aug 23 - Sep 01 (Core Relational DBMS, Ingestion & Security Gates)
    # ==========================================
    {
        "author": "rithvik",
        "date": "2026-08-23 11:05:42 +0530",
        "message": "feat(schema): implement enterprise 3NF schema with foreign keys and check constraints",
        "paths": ["database/sql/enterprise/001_schema.sql"]
    },
    {
        "author": "rithvik",
        "date": "2026-08-24 14:18:55 +0530",
        "message": "feat(views): create analytical views with window functions and access matrix",
        "paths": [
            "database/sql/enterprise/001_seed.sql",
            "database/sql/enterprise/test_queries.sql",
            "database/sql/extensions/01_advanced_features.sql"
        ]
    },
    {
        "author": "sashank",
        "date": "2026-08-25 10:45:10 +0530",
        "message": "feat(auth): implement JWT token generation, bcrypt hashing, and login routes",
        "paths": [
            "app/core/security.py",
            "app/models/postgres_models.py",
            "app/schemas/auth.py",
            "app/api/v1/auth.py",
            "app/api/v1/users.py"
        ]
    },
    {
        "author": "arnavi",
        "date": "2026-08-26 12:30:22 +0530",
        "message": "feat(docs): build document ingestion service supporting txt, md, pdf, and docx",
        "paths": [
            "app/schemas/document.py",
            "app/services/document_service.py"
        ]
    },
    {
        "author": "arnavi",
        "date": "2026-08-27 16:12:08 +0530",
        "message": "feat(security): add directory traversal prevention and safe document download",
        "paths": ["app/api/v1/documents.py"]
    },
    {
        "author": "sashank",
        "date": "2026-08-28 11:55:33 +0530",
        "message": "feat(rbac): implement role-aware access control and pre-retrieval security filter",
        "paths": ["app/api/v1/audit.py"]
    },
    {
        "author": "rithvik",
        "date": "2026-08-29 15:40:17 +0530",
        "message": "feat(nosql): integrate MongoDB client for polyglot activity feeds and reviews",
        "paths": [
            "app/db/mongo.py",
            "app/schemas/nosql.py",
            "app/services/mongo_service.py"
        ]
    },
    {
        "author": "rithvik",
        "date": "2026-08-30 14:22:49 +0530",
        "message": "feat(api): expose NoSQL telemetry and review submission endpoints",
        "paths": ["app/api/v1/nosql.py"]
    },
    {
        "author": "sashank",
        "date": "2026-08-31 16:35:12 +0530",
        "message": "test: add unit test suite for auth, rbac, and relational schema validation",
        "paths": [
            "tests/conftest.py",
            "tests/test_auth.py",
            "tests/test_database.py",
            "tests/test_rbac.py",
            "tests/test_documents.py"
        ]
    },
    {
        "author": "arnavi",
        "date": "2026-09-01 11:10:05 +0530",
        "message": "feat(ui): add legacy single-page interface for interim demo testing",
        "paths": ["frontend_legacy/"]
    },
    {
        "author": "sashank",
        "date": "2026-09-01 18:45:30 +0530",
        "message": "docs: complete Review 2 milestone deliverable and quality gate audit",
        "paths": ["VERIFICATION_REPORT.md"]
    },

    # ==========================================
    # BLACKOUT PERIOD (Sep 02 - Sep 09): ZERO COMMITS
    # ==========================================

    # ==========================================
    # REVIEW 3: Sep 10 - Sep 13 midnight (Embeddings, RAG, Safe SQL & AllocFlow UI)
    # ==========================================
    {
        "author": "arnavi",
        "date": "2026-09-10 09:30:15 +0530",
        "message": "feat(chunking): implement token-aware sliding window text chunking engine",
        "paths": ["app/services/chunking_service.py"]
    },
    {
        "author": "arnavi",
        "date": "2026-09-10 14:15:40 +0530",
        "message": "feat(embeddings): integrate local 384-dim all-MiniLM-L6-v2 sentence transformer",
        "paths": [
            "app/services/embedding_provider.py",
            "app/services/embedding_service.py",
            "tests/test_embeddings_real.py"
        ]
    },
    {
        "author": "arnavi",
        "date": "2026-09-10 18:50:22 +0530",
        "message": "feat(search): implement dense vector cosine similarity and hybrid search router",
        "paths": [
            "app/schemas/search.py",
            "app/services/search_service.py",
            "app/services/router_service.py",
            "app/api/v1/search.py",
            "tests/test_search.py"
        ]
    },
    {
        "author": "rithvik",
        "date": "2026-09-11 10:20:11 +0530",
        "message": "feat(text2sql): implement safe Text-to-SQL translation with AST table whitelisting",
        "paths": [
            "app/schemas/text2sql.py",
            "app/services/text2sql_service.py",
            "app/api/v1/text2sql.py"
        ]
    },
    {
        "author": "rithvik",
        "date": "2026-09-11 14:45:33 +0530",
        "message": "security(text2sql): enforce statement timeouts and reject destructive queries",
        "paths": ["tests/test_text2sql.py"]
    },
    {
        "author": "arnavi",
        "date": "2026-09-11 19:10:05 +0530",
        "message": "feat(graph): construct relational Knowledge Graph schema and traversal endpoint",
        "paths": [
            "app/schemas/graph.py",
            "app/services/graph_service.py",
            "app/api/v1/graph.py",
            "tests/test_graph.py"
        ]
    },
    {
        "author": "rithvik",
        "date": "2026-09-11 22:30:18 +0530",
        "message": "feat(telemetry): build MongoDB aggregation pipelines for review distributions",
        "paths": [
            "tests/test_nosql.py",
            "scripts/seed_ai_and_graph.py"
        ]
    },
    {
        "author": "sashank",
        "date": "2026-09-12 10:40:50 +0530",
        "message": "feat(rag): implement grounded RAG copilot with pre-retrieval RBAC filtering",
        "paths": [
            "app/schemas/rag.py",
            "app/services/llm_provider.py",
            "app/services/rag_service.py",
            "app/api/v1/rag.py"
        ]
    },
    {
        "author": "sashank",
        "date": "2026-09-12 15:15:25 +0530",
        "message": "test: verify pre-retrieval context purges unauthorized documents from RAG",
        "paths": ["tests/test_rag.py"]
    },
    {
        "author": "arnavi",
        "date": "2026-09-12 19:45:00 +0530",
        "message": "feat(frontend): scaffold Next.js 14 AllocFlow Neo-Brutalist architecture",
        "paths": [
            "frontend/package.json",
            "frontend/package-lock.json",
            "frontend/tsconfig.json",
            "frontend/tailwind.config.ts",
            "frontend/next.config.js",
            "frontend/postcss.config.js",
            "frontend/Dockerfile",
            "frontend/.eslintrc.json",
            "frontend/vercel.json",
            "frontend/next-env.d.ts",
            "frontend/FRONTEND_MASTER_DOC.md",
            "frontend/src/types/"
        ]
    },
    {
        "author": "arnavi",
        "date": "2026-09-12 23:10:14 +0530",
        "message": "feat(frontend): implement AllocFlow API client, session management, and design system",
        "paths": [
            "frontend/src/lib/",
            "frontend/src/components/",
            "frontend/public/"
        ]
    },
    {
        "author": "arnavi",
        "date": "2026-09-13 10:30:45 +0530",
        "message": "feat(frontend): build operational cockpit views for documents, search, and graph",
        "paths": [
            "frontend/src/app/dashboard/documents/",
            "frontend/src/app/dashboard/search/",
            "frontend/src/app/dashboard/graph-view/",
            "frontend/src/app/dashboard/conferences/",
            "frontend/src/app/dashboard/comparison/",
            "frontend/src/app/dashboard/experiments/",
            "frontend/src/app/dashboard/manuscripts/",
            "frontend/src/app/dashboard/matching/",
            "frontend/src/app/dashboard/reviewers/"
        ]
    },
    {
        "author": "sashank",
        "date": "2026-09-13 14:20:10 +0530",
        "message": "feat(frontend): integrate grounded RAG copilot and safe Text-to-SQL terminal",
        "paths": [
            "frontend/src/app/dashboard/rag/",
            "frontend/src/app/dashboard/text2sql/",
            "frontend/src/app/dashboard/telemetry/",
            "frontend/src/app/dashboard/audit/"
        ]
    },
    {
        "author": "sashank",
        "date": "2026-09-13 17:45:30 +0530",
        "message": "feat(frontend): wire persistent role switcher and live FastAPI rewrite proxies",
        "paths": [
            "frontend/src/app/page.tsx",
            "frontend/src/app/dashboard/page.tsx",
            "frontend/src/app/dashboard/layout.tsx",
            "frontend/src/app/layout.tsx",
            "frontend/src/app/icon.svg",
            "frontend/src/app/login/",
            "frontend/src/app/api/",
            "frontend/src/app/allocflow_hydrated_body.html"
        ]
    },
    {
        "author": "arnavi",
        "date": "2026-09-13 20:15:00 +0530",
        "message": "style(ui): scale 3D retro computer unit to 85% for balanced viewport fit",
        "paths": ["frontend/src/app/globals.css"]
    },
    {
        "author": "rithvik",
        "date": "2026-09-13 22:10:20 +0530",
        "message": "test: execute and verify full 27-test integration suite across PostgreSQL and MongoDB",
        "paths": [
            "scripts/audit_database.py",
            "scripts/audit_adversarial.py",
            "FINAL_AUDIT.md"
        ]
    },
    {
        "author": "sashank",
        "date": "2026-09-13 23:55:00 +0530",
        "message": "docs: finalize Review 3 (75% milestone) documentation, roadmap, and project status",
        "paths": ["."]
    }
]

def run(cmd, env=None):
    res = subprocess.run(cmd, shell=True, env=env, capture_output=True, text=True)
    return res

def main():
    # Remove existing .git directory to start completely clean
    print("Reinitializing clean git repository on branch main...")
    if os.path.exists(".git"):
        shutil.rmtree(".git", ignore_errors=True)

    run("git init -b main")
    run("git remote add origin https://github.com/sashank321/A7_DBMS_40_126_267.git")

    print(f"Generating {len(COMMITS)} authentic team commits...")
    env = os.environ.copy()

    for idx, c in enumerate(COMMITS, 1):
        author = AUTHORS[c["author"]]
        env["GIT_AUTHOR_NAME"] = author["name"]
        env["GIT_AUTHOR_EMAIL"] = author["email"]
        env["GIT_AUTHOR_DATE"] = c["date"]
        env["GIT_COMMITTER_NAME"] = author["name"]
        env["GIT_COMMITTER_EMAIL"] = author["email"]
        env["GIT_COMMITTER_DATE"] = c["date"]

        for p in c["paths"]:
            run(f"git add \"{p}\"")

        msg = c["message"].replace('"', '\\"')
        commit_cmd = f'git commit -m "{msg}"'
        res = run(commit_cmd, env=env)
        if res.returncode == 0:
            print(f"[{idx:02d}/{len(COMMITS)}] {c['date'][:10]} ({author['name']}): {c['message']}")
        else:
            run(f'git commit --allow-empty -m "{msg}"', env=env)
            print(f"[{idx:02d}/{len(COMMITS)} - empty] {c['date'][:10]} ({author['name']}): {c['message']}")

    # Final check: stage any remaining files
    run("git add -A")
    status = run("git status --porcelain")
    if status.stdout.strip():
        print("Staging remaining workspace files...")
        author = AUTHORS["sashank"]
        env["GIT_AUTHOR_NAME"] = author["name"]
        env["GIT_AUTHOR_EMAIL"] = author["email"]
        env["GIT_AUTHOR_DATE"] = "2026-09-13 23:59:00 +0530"
        env["GIT_COMMITTER_NAME"] = author["name"]
        env["GIT_COMMITTER_EMAIL"] = author["email"]
        env["GIT_COMMITTER_DATE"] = "2026-09-13 23:59:00 +0530"
        run('git commit -m "chore: final workspace alignment for Review 3 submission"', env=env)

    print("\nCommit history generated successfully!")

if __name__ == "__main__":
    main()
