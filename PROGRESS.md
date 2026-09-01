# CaseGrid — Comprehensive Project Reference & Progress Handoff

> **Notice for AI Assistants & LLMs**: This is the single source of truth for the CaseGrid repository. Read this file completely before making architectural decisions or writing new code.

---

## 1. Executive Summary & Overview

- **Project Name**: CaseGrid — Secure Digital Document Management System
- **Context/Domain**: Law Enforcement & Legal Tech MVP (NCRB / Blockchain & Cybersecurity Theme)
- **Primary Goal**: Tamper-evident storage, verification, and audit logging of digital legal evidence (FIRs, Charge Sheets, Witness Statements, Forensic Reports, Court Filings).
- **Core Value Proposition**: Dual-layer security combining **AES-256-CBC client-side/server encryption** in MinIO object storage with an **immutable SHA-256 linked blockchain ledger** in PostgreSQL to guarantee evidence integrity across police, prosecution, and judiciary.

---

## 2. System Architecture & Data Flow

```
                               ┌──────────────────────────────────────────────┐
                               │                 Frontend UI                  │
                               │          React 19 + Vite + Tailwind          │
                               └──────────────────────┬───────────────────────┘
                                                      │ HTTP / REST (JWT)
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │                 Backend API                  │
                               │            Node.js + Express (ESM)           │
                               └──────┬───────────────────┬───────────────────┘
                                      │                   │
                     1. Upload & Hash │                   │ 3. Log Audit & Block
                                      ▼                   ▼
       ┌──────────────────────────────────────┐   ┌──────────────────────────────────┐
       │             MinIO Bucket             │   │        PostgreSQL Database       │
       │       `casegrid-documents`           │   │         (via Prisma ORM)         │
       │  Stores AES-256 Encrypted Raw Files  │   │  • `users` (RBAC)                │
       └──────────────────────────────────────┘   │  • `documents` (Metadata & IV)   │
                                                  │  • `chain_blocks` (SHA-256 Ledger)│
                                                  │  • `audit_logs` (Forensics)      │
                                                  └──────────────────────────────────┘
```

### Document Upload & Encryption Flow:
1. **Raw File Upload**: Multipart form received by Express backend (`multer`).
2. **Hashing**: SHA-256 hash calculated on the **unencrypted original file stream**.
3. **Encryption**: AES-256-CBC encryption applied using standard key + unique random Initialization Vector (IV).
4. **Object Storage**: Encrypted payload saved directly to MinIO bucket `casegrid-documents`.
5. **Chain Block Append**: New `ChainBlock` appended to DB chain, linking `previousHash` to compute `blockHash`.
6. **Metadata Record**: Document metadata (Case ID, Document Type, IV, MinIO key, User ID, Chain Block ID) saved to `documents` table.
7. **Audit Trail**: Action logged in `audit_logs`.

### Document Verification & Verification Flow:
1. Fetch encrypted binary from MinIO using `minioKey`.
2. Decrypt binary stream using saved `encryptionIV` and system `ENCRYPTION_KEY`.
3. Re-calculate SHA-256 checksum of decrypted payload.
4. Fetch linked `ChainBlock` and compare calculated SHA-256 hash with `ChainBlock.fileHash`.
5. Return verification status: `INTEGRITY_VERIFIED` (green) or `TAMPER_DETECTED` (red).

---

## 3. Tech Stack Reference

| Tier | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, TailwindCSS v4, Lucide React, Axios, React Router v7 |
| **Backend** | Node.js (ESM), Express v4, Multer, Crypto (built-in Node `crypto`) |
| **Database & ORM** | PostgreSQL 16, Prisma ORM v6.8 |
| **Object Storage** | MinIO (S3-compatible API, `minio` SDK v8) |
| **Security & Auth** | JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), AES-256-CBC, SHA-256 |
| **Containerization** | Docker, Docker Compose |

---

## 4. Complete Directory Structure & File Map

```
CaseGrid/
├── .env                          # Local environment variables configuration
├── .env.example                  # Environment template file
├── docker-compose.yml            # Container orchestration (Postgres, MinIO, Backend, Frontend)
├── PROGRESS.md                   # THIS FILE — Primary reference & progress tracker
├── backend/
│   ├── Dockerfile                # Backend containerization spec
│   ├── package.json              # Backend scripts & dependencies
│   ├── prisma/
│   │   ├── schema.prisma         # Prisma data model (User, Document, ChainBlock, AuditLog)
│   │   └── seed.js               # Database seeder for demo users & genesis block
│   └── src/
│       ├── index.js              # Express app entry point & server initialization
│       ├── config/
│       │   ├── env.js            # Environment validation & centralization
│       │   └── minio.js          # MinIO S3 client & bucket initialization
│       ├── middleware/
│       │   ├── auth.js           # JWT authentication middleware
│       │   ├── errorHandler.js   # Global error handling middleware
│       │   └── rbac.js           # Role-Based Access Control middleware
│       ├── modules/
│       │   ├── audit/            # Audit log routes & controller
│       │   ├── auth/             # Auth routes & controller (login, profile)
│       │   └── documents/        # Document upload, view, verify & download logic
│       ├── services/
│       │   ├── auditLogger.js    # Audit logging service helper
│       │   ├── cryptoService.js  # SHA-256 hashing & AES-256-CBC encryption/decryption
│       │   └── integrity/        # Modular integrity chain implementation (Fabric-ready interface)
│       │       ├── CustomChainService.js # In-DB blockchain implementation
│       │       ├── IntegrityService.js   # Abstract interface definition
│       │       └── index.js             # Factory function for integrity provider
│       └── utils/
│           └── responseHandler.js# Standardized JSON response formatters
└── frontend/
    ├── Dockerfile                # Frontend containerization spec
    ├── package.json              # Frontend scripts & dependencies
    ├── vite.config.js            # Vite bundler configuration
    └── src/
        ├── App.jsx               # Main React component with routing setup
        ├── main.jsx              # DOM root mount point
        ├── index.css             # Global styles + Tailwind CSS imports
        ├── api/                  # Axios HTTP client instance & interceptors
        ├── context/
        │   └── AuthContext.jsx   # Authentication context & persistent token state
        └── pages/
            ├── DashboardPage.jsx # Main evidence vault, search, filter & verification modal
            ├── LoginPage.jsx     # Login form with quick role-selection presets
            └── UploadPage.jsx    # Secure document upload & encryption progress form
```

---

## 5. Database Schema Details (`prisma/schema.prisma`)

### Models & Key Fields:
- **`User`**: `id`, `name`, `email` (unique), `passwordHash`, `role` (`ADMIN` | `INVESTIGATING_OFFICER` | `LEGAL_OFFICER` | `JUDGE`), `badgeNumber`, `department`.
- **`Document`**: `id`, `caseId`, `docType` (`FIR` | `CHARGE_SHEET` | `WITNESS_STATEMENT` | `FORENSIC_REPORT` | `COURT_FILING` | `OTHER`), `title`, `mimeType`, `fileSize`, `minioKey`, `encryptionIV`, `uploadedById`, `chainBlockId`.
- **`ChainBlock`**: `id`, `blockIndex` (sequential int), `timestamp`, `docId`, `fileHash` (SHA-256 of raw file), `actorId`, `actorEmail`, `action`, `previousHash`, `blockHash`.
- **`AuditLog`**: `id`, `actorId`, `action` (`LOGIN`, `UPLOAD`, `VIEW`, `DOWNLOAD`, `VERIFY`, `VERIFY_FAIL`), `resourceType`, `resourceId`, `result` (`SUCCESS`, `FAILURE`, `HASH_MATCH`, `HASH_MISMATCH`), `ipAddress`, `userAgent`, `details`.

---

## 6. API Route Reference

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System health check and uptime status |
| `POST` | `/api/auth/login` | Public | Authenticates user, returns JWT token & user profile |
| `GET` | `/api/auth/me` | JWT | Returns current authenticated user profile |
| `GET` | `/api/documents` | JWT | Lists uploaded documents with filters (Case ID, Doc Type) |
| `POST` | `/api/documents/upload` | JWT (Officer/Admin) | Uploads, hashes, encrypts, and stores document |
| `GET` | `/api/documents/:id` | JWT | Retrieves document metadata & chain verification status |
| `GET` | `/api/documents/:id/download` | JWT | Decrypts file from MinIO, verifies hash, and streams download |
| `GET` | `/api/documents/:id/verify` | JWT | Performs real-time SHA-256 verification against blockchain block |
| `GET` | `/api/audit-logs` | JWT (Admin/Judge) | Retrieves system-wide forensic audit log history |

---

## 7. Feature Status & Verification Matrix

### ✅ Fully Implemented & Working Features (100%)
1. **User Authentication & Role Presets**:
   - JWT-based authentication & profile fetching (`/api/auth/login`, `/api/auth/me`).
   - Quick role-switch preset buttons on `LoginPage.jsx` (`Investigating Officer`, `Legal Officer`, `Judge`, `Admin`).
2. **Role-Based Access Control (RBAC)**:
   - Backend endpoint enforcement via `rbac.js` middleware.
   - Frontend UI permission toggles for upload buttons, navigation links, and sensitive actions.
3. **Secure Upload & Dual-Layer Storage Pipeline**:
   - SHA-256 pre-storage hashing of original file stream.
   - AES-256-CBC file payload encryption with unique per-file Initialization Vector (IV).
   - Encrypted object upload to MinIO S3 bucket `casegrid-documents`.
4. **Blockchain Integrity Ledger**:
   - Automatic genesis block (#0) initialization.
   - Append-only linked `ChainBlock` records in PostgreSQL storing SHA-256 file hashes linked by `previousHash` & `blockHash`.
5. **Real-Time Verification Engine**:
   - "Verify Integrity" action on `DashboardPage.jsx`.
   - On-the-fly fetching from MinIO → AES decryption → SHA-256 recalculation → chain hash comparison.
   - Visual verification badge (`UNTAMPERED` vs `TAMPER_DETECTED`).
6. **Decrypted Evidence Download**:
   - Authenticated stream download endpoint that decrypts payload in memory and serves original file with `X-CaseGrid-Verified` header.
7. **Forensic Audit Logging & UI Dashboard (`/audit-logs`)**:
   - System audit trail logging all actions (`LOGIN`, `UPLOAD`, `VIEW`, `DOWNLOAD`, `VERIFY`, `VERIFY_FAIL`) with IP addresses & user IDs.
   - Dedicated `AuditLogsPage.jsx` for Admin & Judge roles with action/result filters and expandable JSON context metadata drawer.
8. **Interactive Case Evidence Timeline (`/timeline`)**:
   - `TimelinePage.jsx` grouping evidence chronologically by Case ID with block indices (`Block #1`, `Block #2`), SHA-256 hashes, and block linking indicators.
9. **Officer Digital Signatures & Sign-Off**:
   - Automatic HMAC-SHA256 digital signature computation attached to `ChainBlock` metadata during officer upload with officer badge numbers.

---

## 8. Operational & Running Guide

### Environment Prerequisites
- Node.js 18+ & npm
- PostgreSQL 16 (Running on localhost:5432 or in Docker)
- MinIO Object Storage (Running on localhost:9000/9001 or in Docker)

### Default Ports Matrix
| Service | Local Host / Port |
| :--- | :--- |
| **Frontend App** | `http://localhost:5173` |
| **Backend Express API** | `http://localhost:5001/api` |
| **PostgreSQL DB** | `localhost:5432` (`casegrid_db`) |
| **MinIO API / Console** | `localhost:9000` / `localhost:9001` |

### Running Local Development Stack

```bash
# 1. Ensure .env exists in root
cp .env.example .env

# 2. Database migration & initial seed (run in backend directory)
cd backend
npm run db:setup

# 3. Start Backend server (runs on port 5001)
npm run dev

# 4. Start Frontend server (in separate terminal tab, runs on port 5173)
cd frontend
npm run dev
```

### Pre-seeded Demo Credentials (Password: `casegrid123`)
- **Investigating Officer**: `rajesh.kumar@police.gov.in`
- **Legal Officer**: `priya.sharma@legal.gov.in`
- **Judge**: `anil.deshmukh@judiciary.gov.in`
- **Admin**: `admin@casegrid.gov.in`

---

## 9. Development Progress Changelog

### Session 1 — Architecture & Core Implementation (2026-08-27)
- Created database schema, Prisma migration, and seed scripts.
- Implemented AES-256-CBC file encryption service and MinIO bucket client.
- Built JWT & Role-Based Access Control (RBAC) middleware.
- Implemented `CustomChainService` for in-database tamper-proof hash linking.
- Built document upload, retrieval, download, and verification API workflows.
- Developed React frontend with authentication context, evidence vault dashboard, upload form, and verification modal.
- Dockerized backend, frontend, database, and storage services.

### Session 2 — Advanced Features & Handoff (2026-09-01)
- Validated setup routines: executed `npm run db:setup` and verified PostgreSQL schema synchronization.
- Resolved local runtime dependency issues regarding MinIO port `9000` / `9001` bindings.
- Built **Forensic Audit Logs UI Page (`AuditLogsPage.jsx`)** for Admin and Judge roles with filtering and metadata inspection drawers.
- Built **Interactive Case Evidence Timeline (`TimelinePage.jsx`)** for visualizing chronological evidence chains per Case ID.
- Implemented **Officer Digital Signatures** during document upload (`SIG-SHA256-...`).
- Updated Navbar and App Router with protected navigation for all new features.
- Updated master LLM handoff documentation (`PROGRESS.md`).

---

## 10. Future Roadmap & Pending Enhancements

1. **Hyperledger Fabric Integration**: Swap `INTEGRITY_PROVIDER=custom` to `INTEGRITY_PROVIDER=fabric` by extending `IntegrityService.js`.
