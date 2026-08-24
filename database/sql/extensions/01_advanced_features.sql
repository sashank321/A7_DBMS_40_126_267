-- ============================================================
-- KnowledgeSphere AI: Advanced Features, Views, Triggers & AI Graph
-- Database: PostgreSQL
-- ============================================================

-- 1. Check constraints on existing tables if not already present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_version_number_positive') THEN
        ALTER TABLE document_versions ADD CONSTRAINT chk_version_number_positive CHECK (version_number > 0);
    END IF;
END $$;

-- 2. Trigger function: Auto-update updated_at on documents
CREATE OR REPLACE FUNCTION fn_update_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documents_update_timestamp ON documents;
CREATE TRIGGER trg_documents_update_timestamp
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION fn_update_document_timestamp();

-- 3. Trigger function: Audit logging on new document version creation
CREATE OR REPLACE FUNCTION fn_audit_document_version()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, document_id, created_at)
    VALUES (NEW.uploaded_by, 'VERSION_UPLOAD: Version ' || NEW.version_number, NEW.document_id, CURRENT_TIMESTAMP);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_version_insert ON document_versions;
CREATE TRIGGER trg_audit_version_insert
AFTER INSERT ON document_versions
FOR EACH ROW
EXECUTE FUNCTION fn_audit_document_version();

-- 4. Analytical Views for College/Viva Demonstrations

-- View 1: Complete document metadata overview with uploader, department, category, and version counts
CREATE OR REPLACE VIEW v_document_overview AS
SELECT 
    d.document_id,
    d.title,
    d.file_name,
    d.file_path,
    u.name AS uploaded_by_user,
    u.email AS uploader_email,
    dep.department_name,
    c.category_name,
    d.created_at,
    d.updated_at,
    COALESCE(MAX(dv.version_number), 1) AS latest_version_number,
    COUNT(DISTINCT dt.tag_id) AS total_tags
FROM documents d
JOIN users u ON d.uploaded_by = u.user_id
JOIN departments dep ON d.department_id = dep.department_id
JOIN categories c ON d.category_id = c.category_id
LEFT JOIN document_versions dv ON d.document_id = dv.document_id
LEFT JOIN document_tags dt ON d.document_id = dt.document_id
GROUP BY d.document_id, d.title, d.file_name, d.file_path, u.name, u.email, dep.department_name, c.category_name, d.created_at, d.updated_at;

-- View 2: Security & Permissions Matrix (computed access per user/document)
CREATE OR REPLACE VIEW v_user_access_matrix AS
SELECT 
    u.user_id,
    u.name AS user_name,
    r.role_name,
    u.department_id AS user_dept_id,
    d.document_id,
    d.title AS document_title,
    d.department_id AS doc_dept_id,
    CASE 
        WHEN r.role_name = 'Admin' THEN TRUE
        WHEN r.role_name = 'Manager' AND u.department_id = d.department_id THEN TRUE
        WHEN d.uploaded_by = u.user_id THEN TRUE
        WHEN dp.can_view IS TRUE THEN TRUE
        ELSE FALSE
    END AS effective_can_view,
    CASE 
        WHEN r.role_name = 'Admin' THEN TRUE
        WHEN r.role_name = 'Manager' AND u.department_id = d.department_id THEN TRUE
        WHEN d.uploaded_by = u.user_id THEN TRUE
        WHEN dp.can_edit IS TRUE THEN TRUE
        ELSE FALSE
    END AS effective_can_edit,
    CASE 
        WHEN r.role_name = 'Admin' THEN TRUE
        WHEN d.uploaded_by = u.user_id THEN TRUE
        WHEN dp.can_delete IS TRUE THEN TRUE
        ELSE FALSE
    END AS effective_can_delete
FROM users u
CROSS JOIN documents d
JOIN roles r ON u.role_id = r.role_id
LEFT JOIN document_permissions dp ON d.document_id = dp.document_id AND u.user_id = dp.user_id;

-- View 3: Advanced Audit Log analytics demonstrating Window Functions (LEAD/LAG/ROW_NUMBER)
CREATE OR REPLACE VIEW v_audit_analytics AS
SELECT 
    a.log_id,
    a.user_id,
    u.name AS user_name,
    a.action,
    a.document_id,
    d.title AS document_title,
    a.created_at,
    LAG(a.action, 1) OVER (PARTITION BY a.user_id ORDER BY a.created_at) AS previous_user_action,
    LAG(a.created_at, 1) OVER (PARTITION BY a.user_id ORDER BY a.created_at) AS previous_action_time,
    ROW_NUMBER() OVER (PARTITION BY a.user_id ORDER BY a.created_at DESC) AS user_action_recency_rank
FROM audit_logs a
JOIN users u ON a.user_id = u.user_id
LEFT JOIN documents d ON a.document_id = d.document_id;

-- ============================================================
-- 5. AI & KNOWLEDGE GRAPH EXTENSION LAYER
-- ============================================================

-- Document Chunks for Retrieval-Augmented Generation (RAG)
CREATE TABLE IF NOT EXISTS document_chunks (
    chunk_id SERIAL PRIMARY KEY,
    document_id INT NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    version_id INT REFERENCES document_versions(version_id) ON DELETE CASCADE,
    chunk_number INT NOT NULL,
    content TEXT NOT NULL,
    token_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, chunk_number)
);

-- Document Embeddings for Vector Search
CREATE TABLE IF NOT EXISTS document_embeddings (
    embedding_id SERIAL PRIMARY KEY,
    chunk_id INT NOT NULL REFERENCES document_chunks(chunk_id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL DEFAULT 'all-MiniLM-L6-v2',
    dimensions INT NOT NULL,
    embedding_vector FLOAT8[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chunk_id, model_name)
);

-- Knowledge Entities for Graph Representation
CREATE TABLE IF NOT EXISTS knowledge_entities (
    entity_id SERIAL PRIMARY KEY,
    entity_name VARCHAR(200) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    description TEXT,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_name, entity_type)
);

-- Knowledge Relationships (Graph Edges)
CREATE TABLE IF NOT EXISTS knowledge_relationships (
    relationship_id SERIAL PRIMARY KEY,
    source_entity_id INT NOT NULL REFERENCES knowledge_entities(entity_id) ON DELETE CASCADE,
    target_entity_id INT NOT NULL REFERENCES knowledge_entities(entity_id) ON DELETE CASCADE,
    relation_type VARCHAR(100) NOT NULL,
    weight FLOAT8 DEFAULT 1.0,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_entity_id, target_entity_id, relation_type)
);

-- Provenance: Entity to Document and Chunk Source Links
CREATE TABLE IF NOT EXISTS entity_sources (
    source_id SERIAL PRIMARY KEY,
    entity_id INT NOT NULL REFERENCES knowledge_entities(entity_id) ON DELETE CASCADE,
    document_id INT NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    chunk_id INT REFERENCES document_chunks(chunk_id) ON DELETE SET NULL,
    confidence FLOAT8 DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_id, document_id, chunk_id)
);

-- Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_chunks_doc ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk ON document_embeddings(chunk_id);
CREATE INDEX IF NOT EXISTS idx_entities_name ON knowledge_entities(entity_name);
CREATE INDEX IF NOT EXISTS idx_entities_type ON knowledge_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON knowledge_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON knowledge_relationships(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON knowledge_relationships(relation_type);
CREATE INDEX IF NOT EXISTS idx_entity_sources_entity ON entity_sources(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_sources_doc ON entity_sources(document_id);
