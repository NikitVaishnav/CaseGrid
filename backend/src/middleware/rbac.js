// ============================================================
// CaseGrid — Role-Based Access Control (RBAC) Middleware
// Restricts endpoint access to specific roles
// ============================================================

import { sendError } from '../utils/apiResponse.js';

/**
 * Creates a middleware that allows only the specified roles.
 * Must be used AFTER the `authenticate` middleware (req.user must exist).
 *
 * Usage:
 *   router.post('/upload', authenticate, authorize('INVESTIGATING_OFFICER', 'LEGAL_OFFICER', 'ADMIN'), handler);
 *
 * @param {...string} allowedRoles - Roles permitted to access the endpoint
 * @returns {import('express').RequestHandler}
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    // Ensure authenticate middleware ran first
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    // Check if the user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
        403
      );
    }

    next();
  };
}
