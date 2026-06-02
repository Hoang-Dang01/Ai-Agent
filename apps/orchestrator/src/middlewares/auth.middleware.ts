import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn({ path: req.path }, '[Auth Middleware] Missing or invalid authorization header');
    res.status(401).json({ error: 'Access Denied: Missing or invalid token format.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      sub?: string;
      id?: string;
      email: string;
    };

    req.user = {
      id: decoded.sub || decoded.id || '',
      email: decoded.email,
    };
    next();
  } catch (error) {
    logger.error(error, '[Auth Middleware] JWT token verification failed:');
    res.status(403).json({ error: 'Access Denied: Invalid or expired token.' });
  }

}
