// backend/routes/authRoutes.ts
// Authentication endpoints

import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { verifyAuth, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/signup - Register new user
 */
router.post(
  '/signup',
  asyncHandler(async (req: any, res: Response) => {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Create user via Supabase Auth
    const { data, error } = await supabase.auth.signUpWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Signup failed', new Error(error.message));
      return res.status(400).json({ error: error.message });
    }

    // Optional: Store additional user info
    if (data.user) {
      await supabase.from('users').insert([
        {
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          role: 'user',
        },
      ]);
    }

    logger.info('User registered', { userId: data.user?.id });

    res.status(201).json({
      user: data.user,
      session: data.session,
    });
  })
);

/**
 * POST /api/auth/signin - Login
 */
router.post(
  '/signin',
  asyncHandler(async (req: any, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Signin failed', new Error(error.message));
      return res.status(401).json({ error: error.message });
    }

    logger.info('User logged in', { userId: data.user?.id });

    res.json({
      user: data.user,
      session: data.session,
    });
  })
);

/**
 * POST /api/auth/logout - Logout
 */
router.post(
  '/logout',
  verifyAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Logout failed', new Error(error.message));
      return res.status(500).json({ error: error.message });
    }

    logger.info('User logged out', { userId });

    res.json({ success: true });
  })
);

/**
 * GET /api/auth/me - Get current user
 */
router.get(
  '/me',
  verifyAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({ user: req.user });
  })
);

/**
 * POST /api/auth/refresh - Refresh session
 */
router.post(
  '/refresh',
  asyncHandler(async (req: any, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      logger.error('Token refresh failed', new Error(error.message));
      return res.status(401).json({ error: error.message });
    }

    res.json({
      session: data.session,
    });
  })
);

export default router;
