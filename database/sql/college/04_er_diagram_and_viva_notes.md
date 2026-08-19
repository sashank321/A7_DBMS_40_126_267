# KnowledgeSphere AI - Database Documentation & Viva Notes

Welcome to **KnowledgeSphere AI** (An AI-powered Enterprise Knowledge Intelligence Platform).
This document provides a complete guide to understanding, setting up, and explaining the PostgreSQL database in your college DBMS viva exam.

---

## 1. Database Structure Overview

The database consists of **10 interconnected relational tables** designed around clean 3rd Normal Form (3NF) principles:

| Table Name | Primary Key | Description |
| :--- | :--- | :--- |
| **`roles`** | `role_id` | Stores user access roles (Admin, Manager, Employee). |
| **`departments`** | `department_id` | Stores company departments (HR, Finance, Engineering, etc.). |
| **`users`** | `user_id` | Stores user profiles linked to roles and departments. |
| **`categories`** | `category_id` | Stores classification categories for enterprise documents. |
| **`documents`** | `document_id` | Main repository for document metadata, uploader, department, and category. |
| **`tags`** | `tag_id` | Reusable labels (e.g., Confidential, Draft, Approved). |
| **`document_tags`** | `(document_id, tag_id)` | Junction table mapping documents to tags (Many-to-Many). |
| **`document_versions`** | `version_id` | Stores file paths and details for historical document revisions. |
| **`audit_logs`** | `log_id` | Security audit trail logging user activities on documents. |
| **`document_permissions`** | `permission_id` | Fine-grained access matrix (`can_view`, `can_edit`, `can_delete`). |

---

## 2. Table Relationships & ER Diagram Description

### Visual Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    ROLES ||--o{ USERS : "assigned to"
    DEPARTMENTS ||--o{ USERS : "belongs to"
    DEPARTMENTS ||--o{ DOCUMENTS : "owns"
    CATEGORIES ||--o{ DOCUMENTS : "classifies"
    USERS ||--o{ DOCUMENTS : "uploads"
    USERS ||--o{ AUDIT_LOGS : "performs action"
    USERS ||--o{ DOCUMENT_VERSIONS : "revises"
    USERS ||--o{ DOCUMENT_PERMISSIONS : "granted access"
    DOCUMENTS ||--o{ DOCUMENT_VERSIONS : "has history"
    DOCUMENTS ||--o{ DOCUMENT_PERMISSIONS : "access rules"
    DOCUMENTS ||--o{ AUDIT_LOGS : "tracked in"
    DOCUMENTS ||--l{ DOCUMENT_TAGS : "tagged with"
    TAGS ||--l{ DOCUMENT_TAGS : "applied to"
```

### Relationship Summary
* **One-to-Many (1:N)**:
  * `roles` ➔ `users`: One role can belong to many users.
  * `departments` ➔ `users`: One department contains many users.
  * `departments` ➔ `documents`: One department manages many documents.
  * `categories` ➔ `documents`: One category classifies many documents.
  * `users` ➔ `documents`: One user can upload many documents.
  * `documents` ➔ `document_versions`: One document can have multiple versions.
  * `users` ➔ `audit_logs`: One user produces many audit log entries.
* **Many-to-Many (M:N)**:
  * `documents` ↔ `tags`: Linked via `document_tags` (Composite PK: `document_id`, `tag_id`).
  * `documents` ↔ `users`: Access permissions linked via `document_permissions`.

---

## 3. Explanation of Every Table (For Viva Questions)

1. **`roles`**:
   * *Why is it needed?* To implement Role-Based Access Control (RBAC). Separating roles from users avoids redundancy and allows role permissions to be updated globally.
2. **`departments`**:
   * *Why is it needed?* To group users and enterprise documents by organizational division (e.g., Legal, Finance).
3. **`users`**:
   * *Why is it needed?* Stores user authentication and profile data. Connects to `roles` via `role_id` (FK) and `departments` via `department_id` (FK).
4. **`categories`**:
   * *Why is it needed?* Standardized top-level classification for documents (e.g., HR Policies, Technical Documentation).
5. **`documents`**:
   * *Why is it needed?* The primary table storing document metadata. It does **not** store raw binary files in the SQL database; instead, it stores the filesystem file path (`file_path`) for performance.
6. **`tags`**:
   * *Why is it needed?* Flexible dynamic keywords that users can search and filter by.
7. **`document_tags`**:
   * *Why is it needed?* Resolves the Many-to-Many relationship between documents and tags. A single document can have multiple tags, and a tag can be attached to multiple documents.
8. **`document_versions`**:
   * *Why is it needed?* Enables document versioning so previous drafts are never overwritten or lost when an update is uploaded.
9. **`audit_logs`**:
   * *Why is it needed?* Compliance and security monitoring. Keeps an immutable history of who viewed, edited, downloaded, or updated a document and when.
10. **`document_permissions`**:
    * *Why is it needed?* Grants explicit permissions (`can_view`, `can_edit`, `can_delete`) to specific users for specific documents beyond department boundaries.

---

## 4. How to Run the Database Locally

### Option A: Using PostgreSQL `psql` Terminal

1. Open your terminal or command prompt.
2. Connect to PostgreSQL and create the database:
   ```bash
   psql -U postgres
   ```
   *(Enter your PostgreSQL password when prompted)*

3. Run the SQL commands in `psql`:
   ```sql
   CREATE DATABASE knowledgesphere_db;
   \c knowledgesphere_db;
   ```

4. Execute the SQL scripts in order:
   ```bash
   \i d:/college/dbms/01_schema.sql
   \i d:/college/dbms/02_sample_data.sql
   \i d:/college/dbms/03_test_queries.sql
   ```

---

### Option B: Using pgAdmin 4 or DBeaver (GUI Tool)

1. Open **pgAdmin 4** or **DBeaver**.
2. Right-click **Databases** ➔ **Create** ➔ **Database** named `knowledgesphere_db`.
3. Open **Query Tool** on `knowledgesphere_db`.
4. Copy and execute the contents of `01_schema.sql`.
5. Copy and execute the contents of `02_sample_data.sql`.
6. Copy and execute the contents of `03_test_queries.sql`.

---

## 5. What We Should Build Next for the AI Layer

Once the basic database is working smoothly, we will add the **AI & Machine Learning Extension Layer**.

Suggested upcoming tables for the AI phase:
1. **`document_chunks`**: Stores broken-down text passages (chunking) from documents for Retrieval-Augmented Generation (RAG).
2. **`document_embeddings`**: Stores vector embeddings (`vector` data type using `pgvector` extension) for semantic similarity search.
3. **`ai_summaries`**: Stores AI-generated document summaries and key takeaways.
4. **`ai_chat_sessions` & `ai_chat_messages`**: Stores user conversations with the RAG AI chatbot, context references, and responses.
5. **`ai_document_insights`**: Stores auto-detected duplicate documents and AI classification tags.
