// ============================================================
// CaseGrid — Standardized API Response Helper
// Ensures consistent response shape across all endpoints
// ============================================================

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {object} data - Response payload
 * @param {string} [message] - Human-readable message
 * @param {number} [statusCode=200] - HTTP status code
 */
export function sendSuccess(res, data = {}, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} message - Error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {object} [details] - Additional error details (dev only)
 */
export function sendError(res, message = 'Internal server error', statusCode = 500, details = null) {
  const response = {
    success: false,
    message,
  };

  // Include error details only in development
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }

  return res.status(statusCode).json(response);
}
