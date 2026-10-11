# 🚀 KnowledgeSphere AI — Quick Setup Guide for Friends

Welcome! This package contains the full source code for **KnowledgeSphere AI** (FastAPI backend + Next.js frontend + PostgreSQL + MongoDB).

---

## 🛠️ 1. Prerequisites
Make sure you have installed on your computer:
* **Python 3.10+** (Python 3.11 or 3.12 recommended)
* **Node.js 18+** & `npm`
* **PostgreSQL** running locally on port `5432`
* **MongoDB** running locally on port `27017` (Optional: can run without MongoDB for core relational features)

---

## 🐍 2. Backend Setup (FastAPI)

1. Open a terminal in the project root folder.
2. Create and activate a virtual environment:
   ```bash
   # Windows (PowerShell):
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   
   # Mac / Linux:
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment variables:
   ```bash
   cp .env.example .env
   # Or on Windows PowerShell:
   Copy-Item .env.example .env
   ```
   *(Update `.env` with your PostgreSQL password if different from default)*

5. Initialize the database schema & seed sample data:
   ```bash
   python -m database.seed
   ```
6. Start the FastAPI backend:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   Backend will be running at: **`http://127.0.0.1:8000`** (Docs at `/docs`)

---

## 💻 3. Frontend Setup (Next.js)

1. Open a second terminal window and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Frontend will be running at: **`http://localhost:3000`**

---

## 🔑 4. Demo Login Credentials

You can log in directly using the 1-click Demo buttons on the `/login` screen or with these accounts:

| Role | Email | Scope |
|---|---|---|
| 👑 **Admin** | `alice.admin@knowledgesphere.ai` | Full view, edit, delete, audit logs across all departments |
| 👔 **Manager** | `bob.hr@knowledgesphere.ai` | View & edit rights within Human Resources department |
| 👤 **Employee** | `hannah.hr@knowledgesphere.ai` | Restricted to own documents and explicit grants |

*(When prompted for 2FA, the 6-digit code will appear in your backend terminal console or local pop-up notification)*

---

## 🌟 5. What to Explore:
* **`/dashboard/documents`**: Upload PDFs, text files, and explore document version control.
* **`/dashboard/rag`**: Ask questions in natural English and get grounded answers with source citations.
* **`/dashboard/text2sql`**: Query the database using plain English and export results to CSV.
* **`/dashboard/graph-view`**: Visualize connections between people, documents, and departments.
* **`/dashboard/audit`**: View immutable security audit logs and the 3NF access matrix.
