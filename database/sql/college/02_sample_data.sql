-- ============================================================
-- Project: KnowledgeSphere AI - Sample Data Script
-- Database: PostgreSQL
-- Description: Inserts realistic initial sample data for testing.
-- ============================================================

-- 1. Insert Roles (3 Roles)
INSERT INTO roles (role_id, role_name) VALUES
(1, 'Admin'),
(2, 'Manager'),
(3, 'Employee');

-- 2. Insert Departments (5 Departments)
INSERT INTO departments (department_id, department_name) VALUES
(1, 'Human Resources'),
(2, 'Finance'),
(3, 'Engineering'),
(4, 'Marketing'),
(5, 'Legal');

-- 3. Insert Users (8 Users)
-- Passwords represented as secure bcrypt-style hashes for realistic context
INSERT INTO users (user_id, name, email, password, role_id, department_id) VALUES
(1, 'Alice Smith', 'alice.admin@knowledgesphere.ai', '$2a$12$eImiTXuWVxfM37uY4JANjO...hash1', 1, 3),
(2, 'Bob Jones', 'bob.hr@knowledgesphere.ai', '$2a$12$eImiTXuWVxfM37uY4JANjO...hash2', 2, 1),
(3, 'Charlie Brown', 'charlie.fin@knowledgesphere.ai', '$2a$12$eImiTXuWVxfM37uY4JANjO...hash3', 2, 2),
(4, 'Diana Prince', 'diana.eng@knowledgesphere.ai', '$2a$12$eImiTXuWVxfM37uY4JANjO...hash4', 3, 3),
(5, 'Evan Wright', 'evan.mkt@knowledgesphere.ai', '$2a$12$eImiTXuWVxfM37uY4JANjO...hash5', 3, 4),
(6, 'Fiona Gallagher', 'fiona.legal@knowledgesphere.ai', '$2a$12$eImiTXuWVxfM37uY4JANjO...hash6', 2, 5),
(7, 'George Clark', 'george.eng@knowledgesphere.ai', '$2a$12$eImiTXuWVxfM37uY4JANjO...hash7', 3, 3),
(8, 'Hannah Abbott', 'hannah.hr@knowledgesphere.ai', '$2a$12$eImiTXuWVxfM37uY4JANjO...hash8', 3, 1);

-- 4. Insert Categories (5 Categories)
INSERT INTO categories (category_id, category_name) VALUES
(1, 'HR Policies'),
(2, 'Financial Reports'),
(3, 'Technical Documentation'),
(4, 'Legal Contracts'),
(5, 'Marketing Strategy');

-- 5. Insert Tags (10 Tags)
INSERT INTO tags (tag_id, tag_name) VALUES
(1, 'Confidential'),
(2, 'Draft'),
(3, 'Approved'),
(4, 'Q1-2026'),
(5, 'Onboarding'),
(6, 'Security'),
(7, 'Compliance'),
(8, 'Budget'),
(9, 'Architecture'),
(10, 'Standard Operating Procedure');

-- 6. Insert Documents (10 Documents)
INSERT INTO documents (document_id, title, description, file_name, file_path, uploaded_by, department_id, category_id) VALUES
(1, 'Employee Handbook 2026', 'Company policy and conduct guide for all staff.', 'employee_handbook_v2.pdf', '/storage/hr/employee_handbook_v2.pdf', 2, 1, 1),
(2, 'Q1 Financial Budget Plan', 'Detailed budget projections for Q1 2026.', 'q1_budget_plan.xlsx', '/storage/finance/q1_budget_plan.xlsx', 3, 2, 2),
(3, 'System Architecture Blueprint', 'High-level cloud microservices architecture design.', 'system_arch_v1.pdf', '/storage/eng/system_arch_v1.pdf', 1, 3, 3),
(4, 'Database Optimization Guide', 'Best practices for PostgreSQL indexing and queries.', 'db_optimization.md', '/storage/eng/db_optimization.md', 4, 3, 3),
(5, 'Non-Disclosure Agreement Template', 'Standard legal NDA template for new vendors.', 'nda_template_2026.docx', '/storage/legal/nda_template_2026.docx', 6, 5, 4),
(6, 'Global Brand Guidelines', 'Logo, typography, and asset branding instructions.', 'brand_guidelines.pdf', '/storage/mkt/brand_guidelines.pdf', 5, 4, 5),
(7, 'Security Compliance Checklist', 'SOC2 and ISO27001 compliance requirements.', 'sec_compliance.pdf', '/storage/eng/sec_compliance.pdf', 1, 3, 3),
(8, 'Remote Work Policy', 'Guidelines and allowance for hybrid/remote work.', 'remote_work_policy.pdf', '/storage/hr/remote_work_policy.pdf', 8, 1, 1),
(9, 'Annual Legal Audit Report', 'Summary of legal risk assessments for 2025-2026.', 'annual_audit.pdf', '/storage/legal/annual_audit.pdf', 6, 5, 4),
(10, 'DevOps CI/CD Pipeline Setup', 'Instructions for automated building and testing.', 'cicd_setup.md', '/storage/eng/cicd_setup.md', 7, 3, 3);

-- 7. Insert Document Versions (Multiple versions for documents 1, 2, 3)
INSERT INTO document_versions (version_id, document_id, version_number, file_path, uploaded_by) VALUES
(1, 1, 1, '/storage/hr/employee_handbook_v1.pdf', 2),
(2, 1, 2, '/storage/hr/employee_handbook_v2.pdf', 2),
(3, 2, 1, '/storage/finance/q1_budget_draft.xlsx', 3),
(4, 2, 2, '/storage/finance/q1_budget_plan.xlsx', 3),
(5, 3, 1, '/storage/eng/system_arch_v1.pdf', 1),
(6, 4, 1, '/storage/eng/db_optimization.md', 4);

-- 8. Insert Document Tags (Many-to-Many connections)
INSERT INTO document_tags (document_id, tag_id) VALUES
(1, 3), -- Doc 1 -> Approved
(1, 5), -- Doc 1 -> Onboarding
(1, 10), -- Doc 1 -> Standard Operating Procedure
(2, 1), -- Doc 2 -> Confidential
(2, 4), -- Doc 2 -> Q1-2026
(2, 8), -- Doc 2 -> Budget
(3, 6), -- Doc 3 -> Security
(3, 9), -- Doc 3 -> Architecture
(4, 9), -- Doc 4 -> Architecture
(5, 1), -- Doc 5 -> Confidential
(5, 7), -- Doc 5 -> Compliance
(7, 1), -- Doc 7 -> Confidential
(7, 6), -- Doc 7 -> Security
(7, 7); -- Doc 7 -> Compliance

-- 9. Insert Document Permissions
INSERT INTO document_permissions (permission_id, document_id, user_id, can_view, can_edit, can_delete) VALUES
(1, 1, 4, TRUE, FALSE, FALSE), -- Diana can view Employee Handbook
(2, 1, 5, TRUE, FALSE, FALSE), -- Evan can view Employee Handbook
(3, 2, 1, TRUE, TRUE, TRUE),   -- Alice (Admin) has full access to Budget Plan
(4, 2, 3, TRUE, TRUE, FALSE),  -- Charlie (Manager) can edit Budget Plan
(5, 3, 4, TRUE, TRUE, FALSE),  -- Diana (Engineering) can edit Architecture Blueprint
(6, 3, 7, TRUE, FALSE, FALSE), -- George can view Architecture Blueprint
(7, 5, 6, TRUE, TRUE, TRUE),   -- Fiona has full access to NDA Template
(8, 7, 4, TRUE, FALSE, FALSE); -- Diana can view Security Checklist

-- 10. Insert Audit Logs
INSERT INTO audit_logs (log_id, user_id, action, document_id) VALUES
(1, 2, 'UPLOAD_DOCUMENT', 1),
(2, 3, 'UPLOAD_DOCUMENT', 2),
(3, 1, 'UPLOAD_DOCUMENT', 3),
(4, 4, 'VIEW_DOCUMENT', 3),
(5, 2, 'UPDATE_DOCUMENT_VERSION', 1),
(6, 6, 'UPLOAD_DOCUMENT', 5),
(7, 5, 'VIEW_DOCUMENT', 6),
(8, 1, 'DOWNLOAD_DOCUMENT', 7),
(9, 4, 'EDIT_DOCUMENT', 4),
(10, 3, 'UPDATE_DOCUMENT_VERSION', 2);

-- Reset sequence values so future manual inserts don't collide
SELECT setval('roles_role_id_seq', (SELECT MAX(role_id) FROM roles));
SELECT setval('departments_department_id_seq', (SELECT MAX(department_id) FROM departments));
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));
SELECT setval('categories_category_id_seq', (SELECT MAX(category_id) FROM categories));
SELECT setval('tags_tag_id_seq', (SELECT MAX(tag_id) FROM tags));
SELECT setval('documents_document_id_seq', (SELECT MAX(document_id) FROM documents));
SELECT setval('document_versions_version_id_seq', (SELECT MAX(version_id) FROM document_versions));
SELECT setval('audit_logs_log_id_seq', (SELECT MAX(log_id) FROM audit_logs));
SELECT setval('document_permissions_permission_id_seq', (SELECT MAX(permission_id) FROM document_permissions));
