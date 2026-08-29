// ============================================================
// CaseGrid — Auth Routes
// POST /api/auth/login  — authenticate and get JWT
// GET  /api/auth/me     — get current user profile
// ============================================================

import { Router } from 'express';
import { login, getMe } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// Public: Login
router.post('/login', login);

// Protected: Get current user profile
router.get('/me', authenticate, getMe);

export default router;
