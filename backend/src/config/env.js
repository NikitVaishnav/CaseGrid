// ============================================================
// CaseGrid — Environment Configuration
// Loads and validates all required environment variables
// ============================================================

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from current working directory AND project root directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Validated environment configuration object.
 * All env vars are read once here — never use process.env directly elsewhere.
 */
const env = {
  // Server
  PORT: parseInt(process.env.PORT, 10) || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database (used by Prisma via DATABASE_URL in schema.prisma)
  DATABASE_URL: process.env.DATABASE_URL,

  // MinIO
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || 'localhost',
  MINIO_PORT: parseInt(process.env.MINIO_PORT, 10) || 9000,
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || 'casegrid_minio',
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || 'casegrid_minio_secret',
  MINIO_BUCKET: process.env.MINIO_BUCKET || 'casegrid-documents',
  MINIO_USE_SSL: process.env.MINIO_USE_SSL === 'true',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'casegrid-jwt-super-secret-change-in-prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // AES-256 Encryption
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ||
    'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',

  // Integrity provider: "custom" or "fabric"
  INTEGRITY_PROVIDER: process.env.INTEGRITY_PROVIDER || 'custom',
};

// ── Validate required vars ──────────────────────────────────

const required = ['DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY'];
const missing = required.filter((key) => !env[key]);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// Validate encryption key length (must be 32 bytes = 64 hex chars)
if (env.ENCRYPTION_KEY.length !== 64) {
  console.error('❌ ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)');
  process.exit(1);
}

export default env;
