// backend/middleware/auth.ts
// JWT verification and authentication middleware

import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  token?: string;
}

const JWT_SECRET = new TextEncoder().encode(config.SUPABASE_JWT_SECRET);

export const verifyAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as any;

    req.user = {
      id: payload.sub || payload.user_id,
      email: payload.email,
      role: payload.role || 'user',
    };
    req.token = token;

    next();
  } catch (error) {
    logger.error('Auth verification failed', error as Error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn('Unauthorized role access attempt', { user: req.user?.id, required: roles });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
