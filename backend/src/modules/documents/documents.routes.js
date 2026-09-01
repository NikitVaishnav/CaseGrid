// ============================================================
// CaseGrid — Document Routes
// All document CRUD + integrity verification endpoints
// ============================================================

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import {
  uploadDocument,
  listDocuments,
  getDocument,
  downloadDocument,
  verifyDocument,
  listCasesWithTimeline,
} from './documents.controller.js';

const router = Router();

// Multer config: store files in memory (we need the buffer for hashing + encryption)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// ── Routes ────────────────────────────────────────────────

// Upload a document (IO, LO, Admin only)
router.post(
  '/upload',
  authenticate,
  authorize('INVESTIGATING_OFFICER', 'LEGAL_OFFICER', 'ADMIN'),
  upload.single('file'),
  uploadDocument
);

// List all documents (all authenticated roles)
router.get('/', authenticate, listDocuments);

// List all cases with timeline history
router.get('/cases/timeline', authenticate, listCasesWithTimeline);

// Get a single document's metadata
router.get('/:id', authenticate, getDocument);

// Download a document (decrypt + verify + stream)
router.get('/:id/download', authenticate, downloadDocument);

// Verify document integrity (without downloading)
router.post('/:id/verify', authenticate, verifyDocument);

export default router;
