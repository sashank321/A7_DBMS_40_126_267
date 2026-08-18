-- ============================================================
-- Project: KnowledgeSphere AI - Database Schema Script
-- Database: PostgreSQL
-- Description: Creates 10 core tables with primary keys,
--              foreign keys, constraints, and simple indexes.
-- ============================================================

-- Drop tables if they already exist (in reverse dependency order)
DROP TABLE IF EXISTS document_permissions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS document_versions CASCADE;
DROP TABLE IF EXISTS document_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ------------------------------------------------------------
-- 1. ROLES TABLE
-- Stores user roles (e.g., Admin, Manager, Employee).
-- ------------------------------------------------------------
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- ------------------------------------------------------------
-- 2. DEPARTMENTS TABLE
-- Stores company departments (e.g., HR, Finance, Engineering).
-- ------------------------------------------------------------
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE
);

-- ------------------------------------------------------------
-- 3. USERS TABLE
-- Stores system users linked to roles and departments.
-- ------------------------------------------------------------
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    department_id INT NOT NULL REFERENCES departments(department_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 4. CATEGORIES TABLE
-- Stores categories for classifying documents.
-- ------------------------------------------------------------
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
);

-- ------------------------------------------------------------
-- 5. DOCUMENTS TABLE
-- Stores core metadata for all uploaded documents.
-- ------------------------------------------------------------
CREATE TABLE documents (
    document_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    department_id INT NOT NULL REFERENCES departments(department_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    category_id INT NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 6. TAGS TABLE
-- Stores reusable descriptive tags for documents.
-- ------------------------------------------------------------
CREATE TABLE tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name VARCHAR(50) NOT NULL UNIQUE
);

-- ------------------------------------------------------------
-- 7. DOCUMENT_TAGS TABLE (Junction Table)
-- Connects documents and tags in a Many-to-Many relationship.
-- Uses a Composite Primary Key (document_id, tag_id).
-- ------------------------------------------------------------
CREATE TABLE document_tags (
    document_id INT REFERENCES documents(document_id) ON DELETE CASCADE ON UPDATE CASCADE,
    tag_id INT REFERENCES tags(tag_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (document_id, tag_id)
);

-- ------------------------------------------------------------
-- 8. DOCUMENT_VERSIONS TABLE
-- Tracks version history for each document.
-- ------------------------------------------------------------
CREATE TABLE document_versions (
    version_id SERIAL PRIMARY KEY,
    document_id INT NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE ON UPDATE CASCADE,
    version_number INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (document_id, version_number)
);

-- ------------------------------------------------------------
-- 9. AUDIT_LOGS TABLE
-- Tracks user actions performed on system documents.
-- ------------------------------------------------------------
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    action VARCHAR(100) NOT NULL,
    document_id INT REFERENCES documents(document_id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 10. DOCUMENT_PERMISSIONS TABLE
-- Controls user-level access permissions for documents.
-- ------------------------------------------------------------
CREATE TABLE document_permissions (
    permission_id SERIAL PRIMARY KEY,
    document_id INT NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE ON UPDATE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    UNIQUE (document_id, user_id)
);

-- ============================================================
-- SIMPLE INDEXES FOR QUERY OPTIMIZATION
-- ============================================================

-- Fast lookup of users by email during login
CREATE INDEX idx_users_email ON users(email);

-- Fast filtering of documents by uploader
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);

-- Fast filtering of documents by department
CREATE INDEX idx_documents_department ON documents(department_id);

-- Fast filtering of documents by category
CREATE INDEX idx_documents_category ON documents(category_id);

-- Fast retrieval of versions for a document
CREATE INDEX idx_document_versions_doc ON document_versions(document_id);
