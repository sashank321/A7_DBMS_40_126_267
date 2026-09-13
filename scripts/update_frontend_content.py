html_path = 'frontend/src/app/allocflow_hydrated_body.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    # 1. Header brand & logo
    ('Alloc<span class="text-accent-orange font-normal italic">Flow</span>', 'Knowledge<span class="text-accent-orange font-normal italic">Sphere</span>'),
    ('AllocFlow 1.0', 'KnowledgeSphere OS 1.0'),
    ('Open AllocFlow Portal', 'Open KnowledgeSphere Cockpit'),
    ('© 2026 AllocFlow Systems · D Mounika. All rights reserved.', '© 2026 KnowledgeSphere AI · Enterprise Intelligence Platform. All rights reserved.'),

    # 2. Header Menu
    ('<span>Algorithms</span>', '<span>Capabilities</span>'),
    ('Dinic Algorithm', 'PostgreSQL 3NF Core'),
    ('O(V²E) Level Graph Blocking Flow', '15 Normalized Relational Tables'),
    ('Edmonds-Karp', '384-dim Vectors'),
    ('O(V·E²) BFS Shortest Path', 'all-MiniLM-L6-v2 Embeddings'),
    ('Ford-Fulkerson', 'Grounded RAG Copilot'),
    ('O(E·|f|) DFS Augmenting Path', 'RBAC Filtered with Citations'),
    ('Invariant Verification', 'Safe Text-to-SQL'),
    ('SHA-256 Graph Fingerprints', 'AST Validated Analytical Terminal'),
    ('Java 21 DSA', 'PostgreSQL 18'),

    # Mobile menu
    ('Dinic Engine', '384-dim Vectors'),
    ('O(V²E) Blocking Flow', 'Dense Semantic Search'),
    ('O(V·E²) BFS Path', 'RBAC Filtered Citations'),
    ('O(E·|f|) DFS Path', 'AST Whitelisted Queries'),

    # 3. Hero Section
    ('The Enterprise <br class="hidden sm:inline">\n    <span class="italic font-normal">Allocation Engine.</span>',
     'The Enterprise <br class="hidden sm:inline">\n    <span class="italic font-normal">Knowledge Intelligence Platform.</span>'),
    ('The Enterprise <br class="hidden sm:inline">\r\n    <span class="italic font-normal">Allocation Engine.</span>',
     'The Enterprise <br class="hidden sm:inline">\r\n    <span class="italic font-normal">Knowledge Intelligence Platform.</span>'),
    ('AllocFlow automates complex peer-review manuscript assignments using pure Java 21 Max-Flow algorithms. Tri-algorithm equivalence proofs, zero-COI guarantees, and instant explainability.',
     'KnowledgeSphere AI unites a normalized PostgreSQL 18 relational schema, 384-dimensional dense semantic embeddings, role-aware grounded RAG, and safe Text-to-SQL analytics into an enterprise knowledge cockpit.'),
    ('Pure Java 21 Engine', 'PostgreSQL 18.4 Core (3NF)'),
    ('Tri-Algorithm Equivalence', '384-dim Dense Vectors'),

    # Hero stats
    ('3 Built-in (FF, EK, Dinic)', 'PostgreSQL 18.4 (15 Tables in 3NF)'),
    ('ALGORITHMS', 'RELATIONAL CORE'),
    ('EQUIVALENCE PROOFS', 'EMBEDDINGS'),
    ('SHA-256 Verified', 'all-MiniLM-L6-v2 (384-dim)'),
    ('TIME COMPLEXITY', 'RETRIEVAL MODE'),
    ('O(V²E) Dinic Optimal', 'Hybrid RRF (Vector + SQL)'),
    ('ALLOCATION GUARANTEE', 'SECURITY FILTER'),
    ('100% Mathematical Bound', 'Pre-Retrieval RBAC Gate'),
    ('THROUGHPUT', 'TEST SUITE'),
    ('500+ Papers / Sec', '27/27 Tests Passing (100%)'),
    ('TECH STACK', 'POLYGLOT STORE'),
    ('Java 21 + Spring Boot 3', 'FastAPI + PostgreSQL + MongoDB'),

    # 4. CRT 3D computer unit
    ('Papers (120)', 'Documents (10)'),
    ('Reviewers (45)', 'Vectors (384-dim)'),
    ('Conflicts (18)', 'Entities (5 Nodes)'),
    ('Tracks (4)', 'Access Matrix (80)'),
    ('Flow Solver', 'Grounded RAG Assistant'),
    ('> Book the cheapest f', '> Query: "Explain the architecture of KnowledgeSphere"'),

    # 5. Features Section
    ('Model. <br><span style="color:#7B6B8A;font-style:italic">Allocate.</span> <br>Prove.',
     'Store. <br><span style="color:#7B6B8A;font-style:italic">Retrieve.</span> <br>Ground.'),
    ('From directed bipartite network construction to cryptographic SHA-256 explainability proofs — pure maximum flow algorithms engineered for academic peer review.',
     'From 3NF normalized relational schema to dense 384-dim embeddings and role-aware grounded RAG — an enterprise intelligence platform engineered for zero hallucination and strict security.'),

    # Sticky notes
    ('MAX FLOW ENGINE', 'POSTGRESQL 18 CORE'),
    ('S → P → R → T DIRECTED NET', '15 TABLES IN 3NF'),
    ('INVARIANT VERIFIED', 'all-MiniLM-L6-v2'),
    ('ZERO-COI SOLVER', 'PRE-RETRIEVAL RBAC'),
    ('HARD GRAPH CONSTRAINTS', 'ZERO DATA LEAKAGE'),
    ('ACADEMIC CONFERENCES', 'SAFE TEXT-TO-SQL'),
    ('PEER REVIEW INTEGRITY', 'AST TABLE WHITELIST'),

    # Mobile sticky badges
    ('CANONICAL FLOW AGENT', 'POSTGRESQL 3NF CORE'),
    ('ZERO-COI ASSISTANT', 'PRE-RETRIEVAL RBAC'),
    ('SEND EMAILS, CALENDAR USING FAIR WORKLOADS', 'ROLE-AWARE SECURITY GATES'),
    ('BEST BROWSER FOR AI AGENTS', 'GROUNDED RAG COPILOT'),
    ('PEER REVIEW INTEGRITY OR GEMINI CLI', 'VERIFIED CHUNK CITATIONS'),

    # Card 1
    ('01 // FLOW', '01 // RELATIONAL CORE'),
    ('Bipartite S → P → R → T Flow Network', 'PostgreSQL 18.4 3NF Normalized Schema'),
    ('Model academic peer review as a canonical maximum flow problem. Build directed bipartite networks with source-to-paper demand constraints, paper-to-reviewer compatibility edges, and reviewer-to-sink capacity bounds.',
     'Architected with 15 base tables in Third Normal Form (3NF), strict referential integrity, and analytical SQL views with window functions (LEAD, LAG, ROW_NUMBER) for automated access governance and security audits.'),

    # Card 2
    ('02 // TRI-ALGO', '02 // DENSE VECTORS'),
    ('Tri-Algorithm Equivalence', '384-dim Local Semantic Embeddings'),
    ('Execute Ford-Fulkerson (DFS), Edmonds-Karp (BFS), and Dinic (Blocking Flow) in parallel. Mathematically verify identical max-flow value across all three engines.',
     'Generated using local sentence-transformers (all-MiniLM-L6-v2) without third-party API dependencies. True mathematical cosine similarity search with sub-millisecond vector indexing.'),
    ('3 engines active', '3 retrieval engines active'),
    ('> Ford-Fulkerson: verified<br>&gt; Edmonds-Karp: verified<br>&gt; Dinic Optimal: verified',
     '> Semantic Vector Search: verified<br>&gt; Structured SQL Filter: verified<br>&gt; Hybrid RRF Fusion: verified'),

    # Card 3
    ('03 // COI', '03 // RBAC SECURITY'),
    ('Zero Conflict of Interest', 'Pre-Retrieval Access Control'),
    ('Enforce hard structural constraints preventing co-authors, institutional colleagues, and declared conflicts from receiving matching edges. Zero COI guaranteed by construction.',
     'Enforces organizational hierarchy (Admin, Manager, Employee). Unauthorized documents and chunks are purged before context assembly, guaranteeing zero cross-department data leakage.'),

    # Card 4
    ('04 // PROOF', '04 // GROUNDED RAG'),
    ('&ldquo;Explain This Assignment&rdquo;', '&ldquo;Grounded Copilot with Citations&rdquo;'),
    ('Generate transparent explainability proofs for every paper-reviewer edge. Inspect topic affinity overlap, keyword breakdowns, capacity headroom, and COI clearance.',
     'Synthesizes precise answers citing verified document IDs, versions, and chunk excerpts. Zero hallucinations with transparent mathematical provenance for compliance.'),

    # Card 5
    ('05 // LAB', '05 // SAFE SQL'),
    ('Empirical Scalability Lab', 'AST Validated Text-to-SQL'),
    ('Execute automated parameter sweeps across synthetic datasets (N = 10 to 500+ papers). Measure median runtimes, p95 latencies, and verify asymptotic time complexities.',
     'Translates natural-language analytics into read-only SQL queries with strict table whitelisting. Rejects destructive injection queries (DROP, DELETE, ALTER) before execution.'),

    # 6. Use Cases Section
    ('every academic stakeholder.', 'every enterprise role.'),
    ('From top-tier conference chairs to journal editors — deterministic peer-review allocation powered by AllocFlow.',
     'From compliance officers to engineering architects — deterministic knowledge intelligence powered by KnowledgeSphere AI.'),
    ('Rolling Submissions', 'System Governance'),
    ('Editors', 'Admins'),
    ('Manage continuous rolling manuscript submissions with dynamic reviewer capacity balancing and instant conflict clearance.',
     'Audit access logs, monitor user permission matrices, and enforce global data governance across all enterprise assets.'),
    ('Fair Workload', 'Policy Oversight'),
    ('Reviewers', 'Managers'),
    ('Transparent bidding, keyword domain matching, and guaranteed maximum capacity limits preventing reviewer burnout.',
     'Department-scoped queries ensuring teams receive verified answers on remote work, benefits, and operational standards.'),
    ('CRM + Email', 'Technical Research'),
    ('Sales Reps', 'Engineers'),
    ('Pull open deals from Salesforce, draft follow-up emails for stale leads, and keep HubSpot notes up to date automatically.',
     'Semantic vector search across architectural blueprints, system specifications, and documentation with 384-dim precision.'),
    ('Empirical Benchmarking', 'Data Intelligence'),
    ('Algorithm Analysts', 'Data Analysts'),
    ('Run parameter sweeps comparing Ford-Fulkerson, Edmonds-Karp, and Dinic\'s Algorithm on synthetic sub-graphs.',
     'Generate instant business aggregations and analytical metrics using conversational prompts without writing raw SQL.'),
    ('Conflict Detection', 'Security Audit'),
    ('Ethics Committees', 'Auditors'),
    ('Cryptographically verify that no reviewer was assigned to a paper from their own institution or past co-authors.',
     'Inspect SQL analytical views and window functions (LEAD, LAG) proving strict pre-retrieval data leakage prevention.'),
    ('Explainable Provenance', 'Lineage Tracking'),
    ('Receive cryptographic proof of algorithmic fairness, ensuring their papers were assigned without heuristic bias.',
     'Trace every LLM response back to exact document chunks, upload timestamps, and version history in PostgreSQL.'),
    ('Batch Allocation', 'Knowledge Graph'),
    ('Chairs', 'Architects'),
    ('Batch-allocate 500+ submissions across multiple conference tracks with zero COI violations and balanced reviewer workloads.',
     'Explore typed relational connections between personnel, departments, documents, and technical stacks.'),

    # 7. System Architecture
    ('A deterministic flow engine<span class="italic"> built for academic integrity.</span>',
     'A polyglot intelligence platform<span class="italic"> built for enterprise integrity.</span>'),
    ('Decoupled pure Java 21 DSA core, high-throughput Spring Boot 3 REST API, and interactive bipartite visualization.',
     'Decoupled PostgreSQL 18.4 relational core, local 384-dim SentenceTransformers, and MongoDB 8.0 NoSQL telemetry.'),

    # 8. FAQ Section
    ('Everything you need to know about AllocFlow\'s maximum-flow DSA engine and architecture.',
     'Everything you need to know about KnowledgeSphere AI architecture, embeddings, and security.'),
    ('What makes AllocFlow different from heuristic peer-review tools?',
     'How does KnowledgeSphere AI prevent data leakage in RAG?'),
    ('Unlike heuristic, greedy, or genetic algorithms that can get trapped in sub-optimal local matchings, AllocFlow formulates peer-review allocation as a canonical Maximum Flow problem on a directed bipartite network S → P → R → T. This guarantees mathematically provable maximum capacity allocations with zero workload violations.',
     'Through strict pre-retrieval RBAC filtering. Chunks and documents are filtered against the user\'s role and department matrix before ranking or prompt assembly. Chunks from unauthorized documents never enter the LLM context window.'),
    ('How is Tri-Algorithm Equivalence mathematically proven?',
     'What role does MongoDB serve in this polyglot architecture?'),
    ('AllocFlow executes Ford-Fulkerson (DFS), Edmonds-Karp (BFS), and Dinic (Blocking Flow) simultaneously across identical bipartite graph structures. It verifies that all three engines compute identical total flow values and generates SHA-256 cryptographic fingerprints of the assignment matrices to ensure invariant correctness.',
     'Polyglot persistence. Relational integrity, ACID transactions, and document metadata belong in PostgreSQL 18, while high-velocity user activity clickstreams and document review feedback are stored in MongoDB 8.0 with aggregation pipelines.'),
    ('How does AllocFlow enforce Zero Conflict of Interest (COI)?',
     'How does Safe Text-to-SQL protect against injection attacks?'),
    ('Conflicts of Interest are enforced at graph construction time. Any paper-reviewer pair with declared co-authorship, institutional overlap, or user-declared COIs has its capacity set strictly to zero (the edge is omitted). As a result, COI violations are mathematically impossible in any valid flow solution.',
     'Safe Text-to-SQL uses strict AST parsing, an absolute table whitelist, read-only SELECT enforcement, query timeouts, and rejection of destructive SQL keywords (DROP, DELETE, ALTER, INSERT). Malicious queries are blocked before database execution.'),
    ('What are the time complexities of the three max-flow engines?',
     'Which embedding model does KnowledgeSphere AI use?'),
    ('Ford-Fulkerson executes in O(E·|f|) where |f| is maximum flow. Edmonds-Karp uses BFS shortest paths to achieve O(V·E²). Dinic constructs layered level graphs with blocking flow augmentations in O(V²E), delivering sub-millisecond assignment execution on large academic datasets.',
     'Pretrained sentence-transformers/all-MiniLM-L6-v2 running locally without external API dependencies. It generates 384-dimensional dense vectors stored directly in PostgreSQL document_embeddings with true mathematical cosine similarity.'),
    ('How does the &ldquo;Explain This Assignment&rdquo; drawer work?',
     'How does the Grounded RAG citation mechanism work?'),
    ('For every matched assignment edge, AllocFlow computes an explainability proof that details the normalized topic affinity score, shared primary and secondary keywords, remaining reviewer capacity headroom, and explicit verification of zero COI flags.',
     'Every generated answer cites exact document IDs, version numbers, and chunk excerpts. The user can expand citations to inspect the raw passage provenance, ensuring full transparency and zero hallucinations.'),
    ('Can AllocFlow scale to top-tier conferences with thousands of submissions?',
     'Can KnowledgeSphere AI ingest multi-format enterprise files?'),
    ('Yes. The Dinic algorithm handles matching for 500+ manuscripts and 200+ reviewers in under 15 milliseconds. The built-in Empirical Scalability Laboratory allows chairs to simulate synthetic datasets and verify performance before launching review cycles.',
     'Yes. The document ingestion engine processes .txt, .md, .pdf, and .docx files with automated text extraction, sliding window chunking, token counting, and secure filesystem persistence with path traversal guards.'),
    ('How is the pure Java 21 DSA engine decoupled from Spring Boot?',
     'How does the Knowledge Graph connect enterprise entities?'),
    ('The core algorithms reside in a standalone, zero-dependency Java library (backend/dsa-engine) with no Spring, Hibernate, or DB dependencies. It can be compiled, tested, and imported into any JVM project independently.',
     'The Knowledge Graph is stored in PostgreSQL relational tables (knowledge_entities, knowledge_relationships) tracking PERSON, DEPARTMENT, DOCUMENT, and TECHNOLOGY nodes linked by typed edges like WORKS_IN, OWNS, EXTENDS, and OPTIMIZES.'),
    ('What authentication and security standards are implemented?',
     'What authentication standards are implemented?'),
    ('AllocFlow features stateless JWT authentication with role-based access control (Admin, Chair, Reviewer, Author), BCrypt password hashing, Flyway schema migrations, and immutable audit logs capturing every allocation run and manual chair override.',
     'KnowledgeSphere AI implements stateless JWT Bearer authentication (HS256), bcrypt password hashing, role-based access control (Admin, Manager, Employee), and immutable PostgreSQL audit logs capturing every data access and query event.'),

    # 9. Footer
    ('Your Allocation. <span class="italic">Your rules.</span>',
     'Your Knowledge. <span class="italic">Your Intelligence.</span>'),
    ('We believe peer review should be deterministically fair and mathematically proven. The future is transparent max-flow algorithms that guarantee zero-COI and balanced workloads. We are building the engine for that future.',
     'We believe enterprise knowledge should be deterministically secure, semantically searchable, and mathematically grounded. Welcome to KnowledgeSphere AI.')
]

applied = 0
for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        applied += 1

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Successfully applied {applied}/{len(replacements)} text replacements in {html_path}!")
