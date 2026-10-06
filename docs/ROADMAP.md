# KnowledgeSphere AI - Project Roadmap & Review Trajectory

**Course**: Database Management Systems (DBMS) Laboratory / Project  
**Team Assignment**: A7_DBMS_40_126_267  
**Team Members**:
- **Sashank V** (Lead, Backend & Security Architect) - sashank321
- **Rithvik V** (Database & NoSQL Systems Engineer) - ithvik30
- **Arnavi N** (AI / Vector Search & Frontend Engineer) - 
arsipuraarnavi-ops

---

## Evaluation Schedule & Milestone Progress

`
[Review 1: 25%] ------> [Review 2: 50%] ------> [Review 3: 75%] ------> [Review 4: 100%]
   (Aug 17-22)             (Aug 23-Sep 1)          (Sep 10-13)             (Final Defense)
     COMPLETED               COMPLETED           CURRENT TARGET               PLANNED
`

---

### Review 1: Trajectory Formulation & System Blueprint (Aug 17 – Aug 22, 2026) — 25% [COMPLETED]
* **Deliverables**:
  - Project specification, problem statement, and enterprise knowledge intelligence architecture.
  - Relational ER diagram modeling: 3NF entities (users, oles, departments, documents, ersions, permissions, udit_logs).
  - Initial repository layout, Docker Compose setup, and FastAPI REST framework boilerplate.
  - Initial SQL DDL scripts for PostgreSQL and document storage folder structuring.
* **Evaluation Status**: Approved by panel.

---

### Review 2: Core Relational DBMS, Ingestion & Security Gates (Aug 23 – Sep 01, 2026) — 50% [COMPLETED]
* **Deliverables**:
  - PostgreSQL 3NF implementation: 15 base tables with primary keys, foreign keys, and CHECK constraints.
  - Analytical SQL views with window functions: _document_overview, _user_access_matrix, _audit_analytics (LEAD/LAG).
  - Multi-format document ingestion engine (.pdf, .docx, .md, .txt) with secure filesystem persistence and path traversal rejection.
  - JWT Bearer authentication (HS256), bcrypt password hashing, and role-based pre-retrieval security filter.
  - MongoDB NoSQL polyglot integration (knowledgesphere_nosql) for document reviews and activity logging.
* **Evaluation Status**: Approved by panel.

---

### [BLACKOUT PERIOD: September 02 – September 09, 2026]
* Academic break / institutional examination period (zero development activity).

---

### Review 3: AI Embeddings, Grounded RAG, Safe Text-to-SQL & AllocFlow UI (Sep 10 – Sep 13, 2026) — 75% [CURRENT SUBMISSION]
* **Deliverables**:
  - **Pretrained Semantic Vector Engine**: 384-dimensional dense vectors using local ll-MiniLM-L6-v2 stored in PostgreSQL document_embeddings.
  - **Grounded RAG Assistant**: Intent-routed query copilot with strict pre-retrieval RBAC filtering and verified chunk citations.
  - **Safe Text-to-SQL Terminal**: Natural language SQL query generator with strict AST table whitelisting and destructive command blocking (DROP, DELETE, ALTER).
  - **Relational Knowledge Graph**: Entity & relationship schema (knowledge_entities, knowledge_relationships) with provenance tracking.
  - **MongoDB Telemetry Aggregations**: Review rating distribution and user engagement metrics via $group and $avg pipelines.
  - **AllocFlow Neo-Brutalist Frontend**: High-productivity cockpit built on Next.js 14, Tailwind CSS, Lucide Icons, and 3D retro computing design system.
  - **Automated Verification**: Comprehensive test suite with 27/27 passing unit and integration tests under pytest.
* **Evaluation Status**: Ready for Review 3 evaluation.

---

### Review 4: Production Hardening, Scalability & Final Viva (Planned for Final Review) — 100% [PLANNED]
* **Planned Enhancements**:
  - Real-time token streaming over WebSockets for interactive copilot typing effect.
  - Asynchronous background task queue (Celery + Redis) for bulk 10,000+ page document indexing.
  - Multi-tenant enterprise tenant isolation and LDAP/ActiveDirectory SSO integration.
  - Final project report, comprehensive performance benchmarking, and viva defense demonstration.
