-- ============================================================
-- Project: KnowledgeSphere AI - Test Queries Script
-- Database: PostgreSQL
-- Description: Basic SQL queries to test and verify the database.
-- ============================================================

-- 1. Show all users with their Role and Department names
SELECT 
    u.user_id,
    u.name AS user_name,
    u.email,
    r.role_name,
    d.department_name,
    u.created_at
FROM users u
JOIN roles r ON u.role_id = r.role_id
JOIN departments d ON u.department_id = d.department_id
ORDER BY u.user_id;


-- 2. Show all documents with uploader name, department, and category
SELECT 
    doc.document_id,
    doc.title,
    doc.file_name,
    u.name AS uploaded_by_user,
    d.department_name,
    c.category_name,
    doc.created_at
FROM documents doc
JOIN users u ON doc.uploaded_by = u.user_id
JOIN departments d ON doc.department_id = d.department_id
JOIN categories c ON doc.category_id = c.category_id
ORDER BY doc.document_id;


-- 3. Show documents uploaded by a particular user (e.g., User ID = 1, Alice Smith)
SELECT 
    doc.document_id,
    doc.title,
    doc.file_name,
    c.category_name,
    doc.created_at
FROM documents doc
JOIN categories c ON doc.category_id = c.category_id
WHERE doc.uploaded_by = 1;


-- 4. Show documents belonging to a specific department (e.g., Engineering - Department ID 3)
SELECT 
    doc.document_id,
    doc.title,
    u.name AS uploaded_by,
    c.category_name,
    doc.created_at
FROM documents doc
JOIN users u ON doc.uploaded_by = u.user_id
JOIN categories c ON doc.category_id = c.category_id
WHERE doc.department_id = 3;


-- 5. Show documents belonging to a category (e.g., Technical Documentation - Category ID 3)
SELECT 
    doc.document_id,
    doc.title,
    doc.file_name,
    d.department_name,
    u.name AS uploaded_by
FROM documents doc
JOIN departments d ON doc.department_id = d.department_id
JOIN users u ON doc.uploaded_by = u.user_id
WHERE doc.category_id = 3;


-- 6. Show tags associated with a specific document (e.g., Document ID = 1)
SELECT 
    doc.document_id,
    doc.title,
    t.tag_name
FROM documents doc
JOIN document_tags dt ON doc.document_id = dt.document_id
JOIN tags t ON dt.tag_id = t.tag_id
WHERE doc.document_id = 1;


-- 7. Show all versions of a specific document (e.g., Document ID = 1)
SELECT 
    dv.version_id,
    doc.title AS document_title,
    dv.version_number,
    dv.file_path,
    u.name AS uploaded_by,
    dv.created_at
FROM document_versions dv
JOIN documents doc ON dv.document_id = doc.document_id
JOIN users u ON dv.uploaded_by = u.user_id
WHERE dv.document_id = 1
ORDER BY dv.version_number ASC;


-- 8. Show documents accessible by a specific user (e.g., User ID = 4, Diana Prince)
-- Returns documents uploaded by Diana OR documents explicitly granted view permission
SELECT DISTINCT
    doc.document_id,
    doc.title,
    doc.file_name,
    d.department_name,
    CASE 
        WHEN doc.uploaded_by = 4 THEN 'Owner'
        WHEN dp.can_edit = TRUE THEN 'Editor'
        ELSE 'Viewer'
    END AS access_level
FROM documents doc
JOIN departments d ON doc.department_id = d.department_id
LEFT JOIN document_permissions dp ON doc.document_id = dp.document_id AND dp.user_id = 4
WHERE doc.uploaded_by = 4 OR dp.can_view = TRUE;


-- 9. Show recent audit logs with user name and document title
SELECT 
    l.log_id,
    u.name AS user_name,
    l.action,
    COALESCE(doc.title, 'N/A') AS document_title,
    l.created_at
FROM audit_logs l
JOIN users u ON l.user_id = u.user_id
LEFT JOIN documents doc ON l.document_id = doc.document_id
ORDER BY l.created_at DESC;


-- 10. Count total documents in each category
SELECT 
    c.category_name,
    COUNT(doc.document_id) AS total_documents
FROM categories c
LEFT JOIN documents doc ON c.category_id = doc.category_id
GROUP BY c.category_id, c.category_name
ORDER BY total_documents DESC;


-- 11. Count total documents in each department
SELECT 
    d.department_name,
    COUNT(doc.document_id) AS total_documents
FROM departments d
LEFT JOIN documents doc ON d.department_id = doc.department_id
GROUP BY d.department_id, d.department_name
ORDER BY total_documents DESC;
