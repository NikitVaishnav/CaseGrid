// ============================================================
// CaseGrid — Audit Log Controller
// Query endpoint for audit logs (Admin & Judge only)
// ============================================================

import { sendSuccess } from '../../utils/apiResponse.js';
import { queryAuditLogs } from '../../services/audit.service.js';

/**
 * GET /api/audit-logs
 * Query audit logs with optional filters and pagination.
 * Restricted to Admin and Judge roles.
 */
export async function getAuditLogs(req, res, next) {
  try {
    const { actorId, action, resourceId, page = 1, limit = 50 } = req.query;

    const result = await queryAuditLogs({
      actorId,
      action,
      resourceId,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return sendSuccess(res, result, 'Audit logs retrieved');

  } catch (error) {
    next(error);
  }
}
