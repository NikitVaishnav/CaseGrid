// ============================================================
// CaseGrid — Auth Controller
// Handles login and profile retrieval
// ============================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { writeAuditLog } from '../../services/audit.service.js';

const prisma = new PrismaClient();

/**
 * POST /api/auth/login
 * Authenticate user with email + password, return JWT + user info.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Account deactivated. Contact admin.', 403);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Generate JWT with userId and role in payload
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // Audit log: successful login
    await writeAuditLog({
      actorId: user.id,
      action: 'LOGIN',
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Return token + user profile (never send passwordHash)
    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        badgeNumber: user.badgeNumber,
        department: user.department,
      },
    }, 'Login successful');

  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 * Requires: authenticate middleware
 */
export async function getMe(req, res, next) {
  try {
    // req.user is set by the authenticate middleware
    return sendSuccess(res, { user: req.user }, 'Profile retrieved');
  } catch (error) {
    next(error);
  }
}
