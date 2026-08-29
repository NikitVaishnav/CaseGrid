// ============================================================
// CaseGrid — Audit Logging Service
// Records every system action for compliance and forensics
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Write an entry to the audit log.
 * Called from controllers after every significant action.
 *
 * @param {object} params
 * @param {string} params.actorId - User who performed the action
 * @param {string} params.action - Action type: LOGIN, UPLOAD, VIEW, DOWNLOAD, VERIFY, VERIFY_FAIL
 * @param {string} [params.resourceType] - Type of resource: DOCUMENT, USER, etc.
 * @param {string} [params.resourceId] - ID of the resource acted upon
 * @param {string} params.result - Result: SUCCESS, FAILURE, HASH_MATCH, HASH_MISMATCH
 * @param {string} [params.ipAddress] - Client IP address
 * @param {string} [params.userAgent] - Client user agent
 * @param {object} [params.details] - Any extra context (stored as JSON)
 * @returns {Promise<object>} The created audit log entry
 */
export async function writeAuditLog({
  actorId,
  action,
  resourceType = null,
  resourceId = null,
  result,
  ipAddress = null,
  userAgent = null,
  details = null,
}) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        actorId,
        action,
        resourceType,
        resourceId,
        result,
        ipAddress,
        userAgent,
        details,
      },
    });
    return log;
  } catch (error) {
    // Audit logging should never crash the main request — log and continue
    console.error('⚠️  Audit log write failed:', error.message);
    return null;
  }
}

/**
 * Query audit logs with pagination and optional filters.
 *
 * @param {object} [filters]
 * @param {string} [filters.actorId] - Filter by actor
 * @param {string} [filters.action] - Filter by action type
 * @param {string} [filters.resourceId] - Filter by resource
 * @param {number} [filters.page=1] - Page number (1-indexed)
 * @param {number} [filters.limit=50] - Items per page
 * @returns {Promise<{ logs: object[], total: number, page: number, totalPages: number }>}
 */
export async function queryAuditLogs({
  actorId,
  action,
  resourceId,
  page = 1,
  limit = 50,
} = {}) {
  const where = {};
  if (actorId) where.actorId = actorId;
  if (action) where.action = action;
  if (resourceId) where.resourceId = resourceId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
