# CaseGrid

CaseGrid is a secure digital document management platform for case-related records, legal evidence, and official documents. It is designed to preserve document confidentiality, maintain a verifiable chain of custody, and help authorized stakeholders confirm whether a stored file has remained unchanged after upload.

The platform is built around a simple principle: sensitive case documents should be encrypted before storage, every important action should be auditable, and document integrity should be independently verifiable.


## Key Capabilities

- Secure authentication with JWT-based sessions
- Role-based access control for police, legal, judicial, and administrative users
- Encrypted document storage using AES-256-CBC
- SHA-256 hashing of original documents for integrity verification
- Tamper-evident integrity ledger backed by PostgreSQL
- Document upload, listing, download, and verification workflows
- Audit logging for login, upload, view, download, and verification activity
- Case-level and document-type metadata for organized evidence handling
- Frontend dashboard for searching, filtering, verifying, and downloading documents

## Intended Users

CaseGrid is designed for environments where document authenticity and controlled access are important, such as:

- Investigating officers managing case records
- Legal officers reviewing submitted evidence
- Judges or judicial reviewers validating document history
- Administrators responsible for system governance and user oversight

## How CaseGrid Works

When a document is uploaded, CaseGrid does not store it as plain data. The backend first calculates a SHA-256 hash of the original file. This hash becomes the document's integrity fingerprint.

After hashing, the file is encrypted with AES-256-CBC using a fresh initialization vector for that specific upload. The encrypted file is stored in MinIO object storage, while PostgreSQL stores the document metadata, encryption IV, uploader information, and the associated integrity-chain block.

The integrity layer records a new block for the upload. Each block includes the document hash, actor details, action, timestamp, previous block hash, and its own computed block hash. Because each block references the block before it, a later change to a previous block breaks the chain relationship and can be detected.

When a user verifies a document, CaseGrid retrieves the encrypted object, decrypts it, hashes the recovered file again, and compares the result with the hash recorded in the integrity ledger. It also checks whether the ledger chain itself is still valid.

## Architecture Overview

```text
Frontend (React + Vite)
        |
        v
Backend API (Node.js + Express)
        |
        +-- Authentication and RBAC
        +-- Document workflow
        +-- Audit logging
        +-- Integrity verification
        |
        +-- PostgreSQL
        |      +-- Users
        |      +-- Document metadata
        |      +-- Integrity chain blocks
        |      +-- Audit logs
        |
        +-- MinIO
               +-- Encrypted document objects
```

## Technology Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React icons

### Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- MinIO object storage
- JWT authentication
- bcrypt password hashing
- AES-256-CBC encryption
- SHA-256 hashing

## Core Modules

### Authentication

The authentication module validates user credentials, checks whether the account is active, and issues a signed JWT. The token carries the user identity and role so protected routes can identify the current user and enforce permissions.

### Role-Based Access Control

CaseGrid separates responsibilities using roles:

- `ADMIN`
- `INVESTIGATING_OFFICER`
- `LEGAL_OFFICER`
- `JUDGE`

Uploads are limited to investigating officers, legal officers, and administrators. Audit-log access is limited to administrators and judges. This prevents every authenticated user from performing every action.

### Document Management

The document module handles the full lifecycle of evidence files:

- Upload a document with case metadata
- Store encrypted file content
- Save searchable metadata
- List and filter documents
- Download a decrypted document
- Verify document integrity without downloading

### Integrity Ledger

The integrity system uses a PostgreSQL-backed custom chain implementation. Each document upload creates a block linked to the previous block. The current implementation is intentionally abstracted behind an `IntegrityService` interface so a production blockchain provider, such as Hyperledger Fabric, can be integrated later without rewriting the document workflow.

### Audit Logging

Audit logs record important system actions with actor, resource, result, IP address, user agent, and contextual details. This supports accountability, forensic review, and compliance-oriented reporting.

## Why These Design Choices Were Made

### Encryption Before Storage

Files are encrypted before being sent to object storage. This means the storage layer only holds encrypted data, reducing exposure if storage access is ever misconfigured or compromised.

### Hashing the Original File

The system hashes the original file before encryption because integrity verification should prove that the actual source document has not changed. Encryption output can differ because of IV usage, but the original file hash remains the stable identity of the document content.

### Separate File Storage and Metadata Storage

MinIO stores encrypted file objects, while PostgreSQL stores metadata and relationships. This separation keeps large binary files out of the relational database and allows the database to focus on searchable, structured records.

### Fresh IV Per File

AES-CBC encryption uses a unique initialization vector for each uploaded file. This prevents identical file content from producing identical encrypted output, which improves confidentiality.

### Tamper-Evident Chain

The integrity chain links every block to the previous block by hash. If someone changes a historical record, the recomputed hash no longer matches, and the chain verification fails.

### Audit Trail

Every important operation is logged so the platform can answer questions such as who uploaded a document, who viewed it, who downloaded it, and whether verification passed or failed.

### Service Abstraction for Integrity

The integrity layer is accessed through a service interface instead of being hardcoded directly into controllers. This keeps the current custom chain usable for the MVP while leaving a clear path to swap in a stronger ledger provider later.

## Primary Workflows

### Upload Workflow

```text
User uploads file
        |
Hash original file with SHA-256
        |
Encrypt file with AES-256-CBC
        |
Store encrypted file in MinIO
        |
Create integrity-chain block
        |
Save metadata in PostgreSQL
        |
Write audit log
```

### Verification Workflow

```text
User requests verification
        |
Fetch encrypted file from MinIO
        |
Decrypt file
        |
Hash decrypted file
        |
Compare current hash with ledger hash
        |
Validate chain links
        |
Return verification result
```

## Repository Structure

```text
backend/
  prisma/
    schema.prisma          Database schema for users, documents, chain blocks, and audit logs
    seed.js                Seed data for platform users
  src/
    config/                Environment and storage configuration
    middleware/            Authentication, authorization, and error handling
    modules/               API modules for auth, documents, and audit logs
    services/              Encryption, storage, audit, and integrity services
    utils/                 Shared helpers

frontend/
  src/
    api/                   API client configuration
    components/            Shared UI components
    context/               Authentication state
    pages/                 Login, dashboard, and upload views
```

## Security Model

CaseGrid uses multiple layers of protection:

- Authentication verifies user identity.
- RBAC limits what each role can do.
- Encryption protects file contents at rest.
- Hashing provides a stable document fingerprint.
- The integrity chain detects record tampering.
- Audit logs preserve accountability for sensitive actions.

## Current Scope

The current implementation focuses on the secure document lifecycle: login, upload, encrypted storage, metadata management, download, verification, and audit logging.

Planned production-facing improvements may include managed deployment, stronger operational monitoring, expanded administrative tooling, external identity-provider integration, and replacing or extending the custom integrity ledger with an enterprise blockchain provider.


