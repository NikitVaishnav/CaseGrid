// ============================================================
// CaseGrid — JWT Authentication Middleware
// Verifies the Bearer token and attaches user info to req.user
// ============================================================

import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import env from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';

const prisma = new PrismaClient();

/**
 * Middleware: Verify JWT from Authorization header.
 * On success, attaches the full user object (minus passwordHash) to req.user.
 * On failure, returns 401.
 */
export async function authenticate(req, res, next) {
  try {
    // Extract token from "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. Provide a Bearer token.', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify and decode the token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Fetch the full user from DB (ensures user still exists and is active)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        badgeNumber: true,
        department: true,
        isActive: true,
      },
    });

    if (!user) {
      return sendError(res, 'User not found', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Account deactivated. Contact admin.', 403);
    }

    // Attach user to request for downstream handlers
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired. Please log in again.', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token.', 401);
    }
    next(error);
  }
}
