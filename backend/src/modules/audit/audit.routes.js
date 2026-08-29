// ============================================================
// CaseGrid — Audit Log Routes
// GET /api/audit-logs — restricted to Admin + Judge
// ============================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { getAuditLogs } from './audit.controller.js';

const router = Router();

// Only Admin and Judge can view audit logs
router.get('/', authenticate, authorize('ADMIN', 'JUDGE'), getAuditLogs);

export default router;
