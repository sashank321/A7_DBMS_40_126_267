# KnowledgeSphere AI
**An AI-Powered Enterprise Knowledge Intelligence Platform**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Pytest](https://img.shields.io/badge/Tests-27%2F27%20Passing-brightgreen.svg?logo=pytest&logoColor=white)](https://pytest.org)

KnowledgeSphere AI is an end-to-end, AI-powered enterprise knowledge management and intelligence system. It combines a **normalized PostgreSQL relational database** (ACID transactions, constraints, views, and window functions), a **MongoDB NoSQL document store** (high-velocity user activity feeds and document reviews), **dense vector similarity search**, a **PostgreSQL-backed entity knowledge graph**, **safe Text-to-SQL analytics**, and a **role-aware Retrieval-Augmented Generation (RAG) assistant** with strict pre-retrieval permission enforcement.

---

## 1. System Architecture

```
                                  +-----------------------+
                                  |   Web UI / Client     |
                                  |  (Frontend Dashboard) |
                                  +-----------+-----------+
                                              |
                                              v
                                  +-----------------------+
                                  |    FastAPI Backend    |
                                  | (REST API + JWT Auth) |
                                  +-----------+-----------+
                                              |
                     +------------------------+------------------------+
                     |                        |                        |
                     v                        v                        v
          +---------------------+  +---------------------+  +---------------------+
          | Intent Query Router |  | Security & RBAC     |  | Document Ingestion  |
          |  (Semantic / SQL /  |  | (Pre-Retrieval Gate |  | (Chunking & Vector  |
          |   Graph / Hybrid)   |  |  Admin/Mgr/Employee)|  |   Embedding Engine) |
          +----------+----------+  +----------+----------+  +----------+----------+
                     |                        |                        |
       +-------------+-------------+          |                        v
       |             |             |          v              +--------------------+
       v             v             v   [Perm Filtered Context] | Filesystem Storage |
+-------------+ +----------+ +-----------+    |              | (storage/documents)|
| Structured  | | Semantic | | Knowledge |    |              +--------------------+
| SQL Engine  | | Vector   | | Graph     |    |
| (PostgreSQL)| | Search   | | Entities  |    |
+------+------+ +----+-----+ +-----+-----+    |
       |             |             |          |
       +-------------+-------------+          |
                     |                        |
                     v                        |
          +---------------------+             |
          |   Hybrid Retrieval  |<------------+
          | (Reciprocal Rank RRF|
          +----------+----------+
                     |
                     v
          +---------------------+       +------------------------+
          |  Grounded Context   |------>| Grounded RAG Response  |
          |  Synthesis Engine   |       | (Answer + Citations)   |
          +---------------------+       +------------------------+
                     |
                     +------------------------+
                     |                        |
                     v                        v
          +---------------------+  +---------------------+
          |     PostgreSQL      |  |    MongoDB NoSQL    |
          | (Relational Core,   |  | (Activity Telemetry |
          |  Views & Vectors)   |  |  & User Reviews)    |
          +---------------------+  +---------------------+
```

---

## 2. Database Engineering & Schema Design (CO1 & CO2)

### Relational Schema (PostgreSQL)
The relational core strictly adheres to **3rd Normal Form (3NF)** principles:
1. **`roles`**: Role-based access control (`Admin`, `Manager`, `Employee`).
2. **`departments`**: Organizational units (`Human Resources`, `Finance`, `Engineering`, `Marketing`, `Legal`).
3. **`users`**: Profiles linked to `roles` and `departments` with bcrypt hashed credentials.
4. **`categories`**: Document taxonomy (`HR Policies`, `Financial Reports`, `Technical Documentation`, `Legal Contracts`, `Marketing Strategy`).
5. **`documents`**: Primary metadata repository storing file paths, owners, departments, and categories.
6. **`tags`**: Dynamic indexing keywords.
7. **`document_tags`**: Junction table resolving Many-to-Many relationships with composite PK `(document_id, tag_id)`.
8. **`document_versions`**: Document revision tracking with `UNIQUE(document_id, version_number)` and `CHECK (version_number > 0)`.
9. **`audit_logs`**: Comprehensive security audit trail tracking user interactions.
10. **`document_permissions`**: Granular per-user override permissions (`can_view`, `can_edit`, `can_delete`).

### AI Extensions Schema (PostgreSQL)
11. **`document_chunks`**: Text passages with overlap and token counts linked to documents and versions.
12. **`document_embeddings`**: Dense numerical vector embeddings for similarity search.
13. **`knowledge_entities`**: Domain entities (`PERSON`, `DEPARTMENT`, `DOCUMENT`, `TECHNOLOGY`).
14. **`knowledge_relationships`**: Graph relationships (`WORKS_IN`, `OWNS`, `EXTENDS`, `OPTIMIZES`).
15. **`entity_sources`**: Provenance traceability linking knowledge entities back to source documents and chunk IDs.

### Analytical Views & Window Functions
* **`v_document_overview`**: Aggregates document metadata, uploader identity, category, and version history.
* **`v_user_access_matrix`**: Computes effective access rights across all users and documents based on roles and explicit overrides (80 computed pairs).
* **`v_audit_analytics`**: Demonstrates SQL window functions (`LAG` for action transitions and `ROW_NUMBER` for recency ranking).

---

## 3. Polyglot Persistence: Why PostgreSQL + MongoDB?

| Storage Requirement | PostgreSQL Relational Core | MongoDB NoSQL Document Store |
| :--- | :--- | :--- |
| **Data Nature** | Highly structured, ACID-critical, relational enterprise compliance data. | Semi-structured, polymorphic, high-velocity activity telemetry and feedback. |
| **Use Case** | User accounts, document metadata, version history, security permissions, audit trails. | User search telemetry, click logs, RAG query latencies, and user rating reviews. |
| **Consistency** | Strict immediate consistency and foreign key integrity. | Flexible JSON documents with `$group` and `$avg` aggregation pipelines. |

---

## 4. Key Capabilities & Engineering Features

### A. Role-Aware Access Control (RBAC) at Retrieval Time
**Security Invariant**: A user must *never* receive answers or citations containing information from documents they are unauthorized to access.
* **Insecure approach (rejected)**: Retrieve everything $\rightarrow$ Send to LLM $\rightarrow$ "Please hide confidential data".
* **Our approach (implemented)**: Authenticate user $\rightarrow$ Pre-retrieval access control filtering $\rightarrow$ Only authorized chunks passed to context $\rightarrow$ Grounded answer synthesized $\rightarrow$ Report count of blocked unauthorized documents.

### B. Hybrid Retrieval & Intent Router
Questions are routed to specialized search pipelines using deterministic classification:
* **`STRUCTURED`**: Numerical metrics, counts, listings $\rightarrow$ Routed to safe Text-to-SQL.
* **`SEMANTIC`**: Conceptual explanations, policy details $\rightarrow$ Dense cosine vector similarity.
* **`GRAPH`**: Relational hierarchy, entity connections $\rightarrow$ Graph traversal.
* **`HYBRID`**: Combined metadata filtering and text matching $\rightarrow$ **Reciprocal Rank Fusion (RRF)**:
  $$\text{RRF Score} = \sum_{m \in M} \frac{1}{60 + \text{rank}_m}$$

### C. Safe Text-to-SQL Engine
* Transforms natural-language analytics into valid PostgreSQL queries.
* **Strict AST Security**: Permits only `SELECT` statements.
* **Table Whitelist**: Strictly limited to approved views and tables (`departments`, `users`, `documents`, `v_document_overview`).
* **Injection Defense**: Rejects `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, and multi-statement execution.

### D. Real Local Semantic Embeddings (SentenceTransformers)
* **Pretrained Neural Model**: Genuine `all-MiniLM-L6-v2` embedding model (~80MB) running offline on standard CPU without external API keys.
* **Dimensionality**: Produces 384-dimensional dense vectors stored directly in PostgreSQL `document_embeddings.embedding_vector`.
* **Provider Abstraction**:
  - `SentenceTransformerEmbeddingProvider`: Default local offline neural model (384 dimensions).
  - `OpenAIEmbeddingProvider`: Cloud production provider (`text-embedding-3-small`, 1536 dimensions).
  - `DeterministicDevelopmentProvider`: CRC32 feature hashing (128 dimensions) for deterministic testing.
* **Configuration**: Set via `EMBEDDING_PROVIDER` environment variable (`sentence_transformers`, `openai`, `deterministic`).

### E. Grounded RAG & LLM Hierarchy (Extractive vs. Generative)
The platform strictly decouples grounded retrieval from synthesis via `BaseLLMProvider`:
* **`OpenAILLMProvider`**: Generative RAG using OpenAI GPT models (`is_generative_llm: True`).
* **`LocalLLMProvider`**: Generative RAG connecting to local OpenAI-compatible endpoints (e.g. Ollama at `http://localhost:11434/v1` with model `llama3`). Automatically falls back to extractive mode if the local daemon is offline.
* **`LocalGroundedSynthesizer`**: Extractive Grounded Retrieval (`is_generative_llm: False`). Assembles verbatim passages from verified document chunks with precise citations (`[Doc: <title>, Ver: <n>, Chunk: <id>]`). Guarantees zero hallucinations and 100% factual accuracy.

| Characteristic | Extractive Grounded Retrieval (`LocalGroundedSynthesizer`) | Generative RAG (`OpenAILLMProvider` / `LocalLLMProvider`) |
| :--- | :--- | :--- |
| **Model Type** | Deterministic excerpt assembly | Autoregressive neural language model (GPT-4o-mini / Llama-3) |
| **Hallucination Risk** | **0.0%** (Verbatim quotes from verified chunks) | Low (Conditioned on prompt context) |
| **Hardware Required** | Standard laptop CPU / Zero external dependencies | GPU/Ollama daemon or external OpenAI API Key |
| **Citation Traceability** | Exact character and chunk attribution | Attributed to context passages |

---

## 5. Quickstart & Installation

### Option 1: Local Development Setup

#### 1. Clone & Install Dependencies
```bash
# Clone the repository and navigate to folder
cd "d:\College\Second Year\Second year 1st sem\dbms"

# Install Python requirements
pip install -r requirements.txt
```

#### 2. Initialize PostgreSQL & MongoDB
Ensure PostgreSQL (port 5432) and MongoDB (port 27017) are running locally:
```bash
# Initialize schema, sample data, and analytical views
python scripts/init_db.py

# Seed AI chunks, dense embeddings, knowledge graph, and MongoDB telemetry
python scripts/seed_ai_and_graph.py
```

#### 3. Run Automated Tests
```bash
python -m pytest -v
```
*(All 27/27 test cases pass out of the box).*

#### 4. Launch Application

**Step A: Launch FastAPI Backend (Port 8000)**
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* **Interactive Swagger UI / API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Legacy Single-Page Fallback**: [http://localhost:8000/](http://localhost:8000/)

**Step B: Launch AllocFlow Next.js 14 Frontend (Port 3000)**
```bash
cd frontend
npm run dev
```
* **Neo-Brutalist Landing Page & Cockpit**: [http://localhost:3000/](http://localhost:3000/)
* **Enterprise Intelligence Cockpit**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
  - **Document Catalog & Multi-Format Ingestion**: `/dashboard/documents`
  - **Grounded RAG Copilot & Intent Routing**: `/dashboard/rag`
  - **384-dim Hybrid Semantic Search**: `/dashboard/search`
  - **Safe AST Text-to-SQL Terminal**: `/dashboard/text2sql`
  - **Knowledge Graph Explorer**: `/dashboard/graph-view`
  - **MongoDB Telemetry & Reviews**: `/dashboard/telemetry`
  - **Analytical Views & Access Matrix**: `/dashboard/audit`

---

### Option 2: Run via Docker Compose

```bash
docker-compose up --build -d
```
Docker Compose spins up:
1. `knowledgesphere_postgres` (`pgvector/pgvector:pg16` on port 5432)
2. `knowledgesphere_mongodb` (`mongo:7.0` on port 27017)
3. `knowledgesphere_backend` (FastAPI application on port 8000)

---

## 6. Pre-Configured Demo Accounts for Viva

| Email | Password | Role | Department | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| `alice.admin@knowledgesphere.ai` | `password123` | **Admin** | Engineering | Full access to all 10 documents, user management, and audit logs. |
| `bob.hr@knowledgesphere.ai` | `password123` | **Manager** | HR | Department-level access to HR documents and public grants. |
| `diana.eng@knowledgesphere.ai` | `password123` | **Employee** | Engineering | Access to owned documents and assigned permissions. |
| `hannah.hr@knowledgesphere.ai` | `password123` | **Employee** | HR | Restricted employee (can only access Remote Work Policy). |

---

## 7. Viva / Demo Questions & Answers

1. **How does your project prevent unauthorized data leakage in RAG?**
   * *Answer*: Pre-retrieval RBAC filtering. Chunks are filtered against `v_user_access_matrix` before being ranked or assembled into context. Chunks from unauthorized documents never enter the context.
2. **What role does MongoDB serve in this architecture?**
   * *Answer*: Polyglot Persistence. Relational integrity and ACID transactions belong in PostgreSQL, while high-velocity user activity streams, search clickstreams, and document review feedback are stored in MongoDB NoSQL collections with aggregation pipelines.
3. **How does Safe Text-to-SQL protect against SQL injection?**
   * *Answer*: Strict AST parsing, an absolute table whitelist, read-only `SELECT` enforcement, statement timeouts, and stripping multi-statement chained semicolons.
