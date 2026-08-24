-- Insert Departments
INSERT INTO departments (id, name, description) VALUES
('d1000000-0000-0000-0000-000000000001', 'Engineering', 'Software Development and IT'),
('d1000000-0000-0000-0000-000000000002', 'Human Resources', 'HR and Employee Success'),
('d1000000-0000-0000-0000-000000000003', 'Security', 'Cybersecurity and Compliance');

-- Insert Roles
INSERT INTO roles (id, name, description) VALUES
('r1000000-0000-0000-0000-000000000001', 'Admin', 'System Administrator'),
('r1000000-0000-0000-0000-000000000002', 'Manager', 'Department Manager'),
('r1000000-0000-0000-0000-000000000003', 'Employee', 'Standard User');

-- Insert Permissions
INSERT INTO permissions (id, action) VALUES
('p1000000-0000-0000-0000-000000000001', 'manage_users'),
('p1000000-0000-0000-0000-000000000002', 'view_all_documents'),
('p1000000-0000-0000-0000-000000000003', 'upload_document');

-- Map Roles to Permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
('r1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001'), -- Admin manages users
('r1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000002'), -- Admin views all docs
('r1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000003'), -- Admin uploads
('r1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000003'), -- Manager uploads
('r1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000003'); -- Employee uploads

-- Insert Users (password_hash is just a dummy hash for seed)
INSERT INTO users (id, email, name, password_hash, department_id) VALUES
('u1000000-0000-0000-0000-000000000001', 'admin@knowledgesphere.ai', 'System Admin', '$2y$10$dummyhash', 'd1000000-0000-0000-0000-000000000001'),
('u1000000-0000-0000-0000-000000000002', 'jane.doe@knowledgesphere.ai', 'Jane Doe', '$2y$10$dummyhash', 'd1000000-0000-0000-0000-000000000002'),
('u1000000-0000-0000-0000-000000000003', 'john.smith@knowledgesphere.ai', 'John Smith', '$2y$10$dummyhash', 'd1000000-0000-0000-0000-000000000003');

-- Map Users to Roles
INSERT INTO user_roles (user_id, role_id) VALUES
('u1000000-0000-0000-0000-000000000001', 'r1000000-0000-0000-0000-000000000001'),
('u1000000-0000-0000-0000-000000000002', 'r1000000-0000-0000-0000-000000000002'),
('u1000000-0000-0000-0000-000000000003', 'r1000000-0000-0000-0000-000000000003');

-- Insert Categories
INSERT INTO categories (id, name, description) VALUES
('c1000000-0000-0000-0000-000000000001', 'Policies', 'Company-wide policies'),
('c1000000-0000-0000-0000-000000000002', 'Technical Docs', 'Architecture and code docs');

-- Insert Document (Note: current_version_id is null initially)
INSERT INTO documents (id, title, description, file_name, file_path, document_type, status, owner_id, department_id, category_id) VALUES
('doc10000-0000-0000-0000-000000000001', 'Remote Work Policy', 'Guidelines for remote work', 'remote_policy.pdf', '/storage/docs/remote_policy.pdf', 'pdf', 'indexed', 'u1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001');

-- Insert Document Version
INSERT INTO document_versions (id, document_id, version_number, file_path, change_summary, uploaded_by) VALUES
('ver10000-0000-0000-0000-000000000001', 'doc10000-0000-0000-0000-000000000001', 1, '/storage/docs/remote_policy.pdf', 'Initial version', 'u1000000-0000-0000-0000-000000000002');

-- Update Document with current_version_id
UPDATE documents SET current_version_id = 'ver10000-0000-0000-0000-000000000001' WHERE id = 'doc10000-0000-0000-0000-000000000001';

-- Insert Document Permissions (Explicit user permission overriding role/dept default)
INSERT INTO document_permissions (document_id, user_id, can_view, can_edit, can_delete) VALUES
('doc10000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000003', true, false, false);

-- Insert Document Chunks
INSERT INTO document_chunks (id, version_id, chunk_number, content) VALUES
('chk10000-0000-0000-0000-000000000001', 'ver10000-0000-0000-0000-000000000001', 1, 'Employees are allowed to work remotely 3 days a week.'),
('chk10000-0000-0000-0000-000000000002', 'ver10000-0000-0000-0000-000000000001', 2, 'Core working hours are 10 AM to 3 PM.');

-- Insert Knowledge Entities
INSERT INTO knowledge_entities (id, entity_type, entity_name, metadata_json) VALUES
('ent10000-0000-0000-0000-000000000001', 'policy', 'Remote Work Protocol', '{"type": "HR Rule"}');

-- Insert Entity Sources
INSERT INTO entity_sources (entity_id, document_id, chunk_id) VALUES
('ent10000-0000-0000-0000-000000000001', 'doc10000-0000-0000-0000-000000000001', 'chk10000-0000-0000-0000-000000000001');

-- Insert Audit Log
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details_json) VALUES
('u1000000-0000-0000-0000-000000000002', 'document_uploaded', 'document', 'doc10000-0000-0000-0000-000000000001', '{"status": "indexed"}');
