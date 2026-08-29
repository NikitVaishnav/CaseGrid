// ============================================================
// CaseGrid — Express Application Entry Point
// ============================================================
// Dev Server entry point
// Startup sequence:
//   1. Load environment config
//   2. Initialize Express with middleware
//   3. Mount API routes
//   4. Ensure MinIO bucket exists
//   5. Initialize integrity chain (genesis block)
//   6. Start listening
// ============================================================

import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import { ensureBucket } from './config/minio.js';
import { getIntegrityService } from './services/integrity/index.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route modules
import authRoutes from './modules/auth/auth.routes.js';
import documentRoutes from './modules/documents/documents.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

const app = express();

// ── Global Middleware ─────────────────────────────────────

// CORS: Allow frontend origin (and any origin in dev)
app.use(cors({
  origin: env.NODE_ENV === 'development' ? '*' : process.env.FRONTEND_URL,
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CaseGrid Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── API Routes ────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit-logs', auditRoutes);

// ── 404 Handler ───────────────────────────────────────────

app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global Error Handler (must be last) ───────────────────

app.use(errorHandler);

// ── Server Startup ────────────────────────────────────────

async function startServer() {
  console.log('\n🔐 CaseGrid — Secure Document Management System');
  console.log('================================================\n');

  try {
    // 1. Ensure MinIO bucket exists
    console.log('📦 Initializing MinIO storage...');
    await ensureBucket();

    // 2. Initialize integrity chain (create genesis block if needed)
    console.log('⛓️  Initializing integrity chain...');
    const integrity = getIntegrityService();
    await integrity.ensureGenesis();

    // 3. Start Express server
    app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server running on http://0.0.0.0:${env.PORT}`);
      console.log(`📋 Health check: http://localhost:${env.PORT}/api/health`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`⛓️  Integrity: ${env.INTEGRITY_PROVIDER}`);
      console.log('\n--- Ready to accept requests ---\n');
    });

  } catch (error) {
    console.error('\n❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
