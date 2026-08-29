// ============================================================
// CaseGrid — Global Error Handler Middleware
// Catches all unhandled errors and returns consistent error responses
// ============================================================

import { sendError } from '../utils/apiResponse.js';

/**
 * Express error-handling middleware (4 args = error handler).
 * Place this LAST in the middleware chain.
 */
export function errorHandler(err, req, res, _next) {
  console.error(`❌ [${req.method} ${req.path}]`, err.message);

  // Prisma known errors
  if (err.code === 'P2002') {
    return sendError(res, 'A record with this value already exists', 409);
  }
  if (err.code === 'P2025') {
    return sendError(res, 'Record not found', 404);
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 'File too large (max 50MB)', 413);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return sendError(res, 'Unexpected file field', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401);
  }

  // Default to 500
  return sendError(res, err.message || 'Internal server error', err.status || 500, {
    stack: err.stack,
  });
}
