-- Test 1: Sample Joins (Users with their Roles and Departments)
SELECT u.name AS user_name, u.email, d.name AS department, r.name AS role
FROM users u
JOIN departments d ON u.department_id = d.id
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id;

-- Test 2: Sample Joins (Documents with Owner, Department, Category, and Current Version)
SELECT doc.title, doc.status, u.name AS owner, d.name AS department, c.name AS category, v.version_number
FROM documents doc
JOIN users u ON doc.owner_id = u.id
JOIN departments d ON doc.department_id = d.id
JOIN categories c ON doc.category_id = c.id
LEFT JOIN document_versions v ON doc.current_version_id = v.id;

-- Test 3: Status Check Constraint (This should fail if uncommented)
-- INSERT INTO documents (title, description, file_name, file_path, document_type, status, owner_id, department_id)
-- VALUES ('Test', 'Test', 'test.pdf', '/test.pdf', 'pdf', 'INVALID_STATUS', 'u1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001');

-- Test 4: Version Number Check Constraint (This should fail if uncommented)
-- INSERT INTO document_versions (document_id, version_number, file_path, uploaded_by) 
-- VALUES ('doc10000-0000-0000-0000-000000000001', 0, '/test.pdf', 'u1000000-0000-0000-0000-000000000001');

-- Test 5: Unique Constraint on Document Versions (This should fail if uncommented because version 1 already exists)
-- INSERT INTO document_versions (document_id, version_number, file_path, uploaded_by) 
-- VALUES ('doc10000-0000-0000-0000-000000000001', 1, '/test2.pdf', 'u1000000-0000-0000-0000-000000000001');

-- Test 6: Verify Knowledge Graph Provenance (Entity -> Document Chunk)
SELECT ke.entity_name, ke.entity_type, doc.title AS source_document, chk.chunk_number, chk.content AS chunk_content
FROM knowledge_entities ke
JOIN entity_sources es ON ke.id = es.entity_id
JOIN documents doc ON es.document_id = doc.id
JOIN document_chunks chk ON es.chunk_id = chk.id;
