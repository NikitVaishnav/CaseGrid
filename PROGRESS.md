# CaseGrid — PROGRESS.md (LLM Handoff Tracker)

> **Purpose**: This file tracks every significant change made to the CaseGrid project.
> Any LLM (or human) continuing work on this project should read this file first
> to understand what has been done, what's in progress, and what remains.

---

## Project Overview
- **Name**: CaseGrid — Secure Digital Document Management System
- **Purpose**: NCRB hackathon MVP (Blockchain & Cybersecurity theme)
- **Tech Stack**: React+Vite+TailwindCSS v4 | Node+Express (ESM, JS) | Prisma+PostgreSQL | MinIO | JWT+RBAC | AES-256 | Docker
- **Implementation Plan**: See `implementation_plan.md` in the artifact directory

---

## Architecture Notes
- **Integrity Layer**: Uses an abstract `IntegrityService` interface with a `CustomChainService` (PostgreSQL-backed blockchain). The factory pattern (`services/integrity/index.js`) allows swapping in Hyperledger Fabric later via `INTEGRITY_PROVIDER` env var.
- **Roles**: `ADMIN`, `INVESTIGATING_OFFICER`, `LEGAL_OFFICER`, `JUDGE`
- **File Flow**: Upload → SHA-256 hash raw file → AES-256-CBC encrypt → store in MinIO → add block to chain → save metadata in PostgreSQL → audit log
- **Verification Flow**: Fetch from MinIO → decrypt → re-hash → compare with chain block hash

---

## Change Log

### Session 1 — 2026-08-27

#### ✅ Completed
1. **Implementation Plan** — Full plan approved by user.
2. **Phase 1 — Infrastructure**: `docker-compose.yml`, `.env.example`, Prisma schema with 4 models, seed script (`prisma/seed.js`), `.gitignore`.
3. **Phase 2 — Backend Core**: Centralized env config, MinIO auto-bucket initialization, AES-256-CBC file encryption/decryption, SHA-256 utility, audit logger, global error handler.
4. **Phase 3 — Auth**: JWT authentication middleware, RBAC middleware, Login & profile endpoints (`/api/auth/login`, `/api/auth/me`).
5. **Phase 4 — Integrity Chain**: Fabric-ready `IntegrityService` interface, `CustomChainService` with SHA-256 linking, Genesis block auto-creation, chain factory.
6. **Phase 5 — Document Workflow**: Upload endpoint (Encrypt -> MinIO -> Chain -> DB -> Audit), List documents, Get document, Download document (Decrypt -> Verify -> Stream), Verify endpoint.
7. **Phase 6 — Frontend**: React + Vite + TailwindCSS v4 setup, Auth Context, Axios client, Login Page (with quick-select role buttons), Dashboard with document list & "Verify Integrity" modal/badge, Upload Page with AES-256 & chain notifications, Protected Routes + Navbar.
8. **Phase 7 — Dockerization**: Dockerfiles for backend and frontend, `docker-compose.yml` configured for Postgres, MinIO, Backend, Frontend.

---

## Key File Reference

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Orchestrates Postgres, MinIO, backend, frontend |
| `backend/prisma/schema.prisma` | Database schema (User, Document, ChainBlock, AuditLog) |
| `backend/prisma/seed.js` | Seeds default admin + sample users |
| `backend/src/index.js` | Express app entry point |
| `backend/src/services/integrity/IntegrityService.js` | Abstract interface (Fabric-ready) |
| `backend/src/services/integrity/CustomChainService.js` | In-DB custom chain implementation |
| `backend/src/services/integrity/index.js` | Factory — returns active implementation |
| `backend/src/middleware/auth.js` | JWT verification |
| `backend/src/middleware/rbac.js` | Role-based access control |
| `frontend/src/App.jsx` | React router + layout |
| `frontend/src/context/AuthContext.jsx` | Auth state management |
| `frontend/src/pages/LoginPage.jsx` | Authentication UI with hackathon presets |
| `frontend/src/pages/DashboardPage.jsx` | Document vault & integrity verification UI |
| `frontend/src/pages/UploadPage.jsx` | Document upload and encryption form |

---

## How to Run Locally
```bash
# 1. Copy env file
cp .env.example .env

# 2. Run all services with Docker
docker-compose up --build

# Access Frontend: http://localhost:5173
# Access Backend API: http://localhost:5001/api
# Access MinIO Console: http://localhost:9001
```

Default credentials (password: `casegrid123`):
- Investigating Officer: `rajesh.kumar@police.gov.in`
- Legal Officer: `priya.sharma@legal.gov.in`
- Judge: `anil.deshmukh@judiciary.gov.in`
- Admin: `admin@casegrid.gov.in`
