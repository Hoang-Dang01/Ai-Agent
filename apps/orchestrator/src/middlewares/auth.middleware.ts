import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { dbService } from '../services/db.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn({ path: req.path }, '[Auth Middleware] Missing or invalid authorization header');
    res.status(401).json({ error: 'Access Denied: Missing or invalid token format.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as {
      sub?: string;
      id?: string;
      email?: string;
      role?: string;
    };

    const userId = decoded.sub || decoded.id;
    if (!userId || !decoded.email || decoded.role !== 'authenticated') {
      logger.warn({ path: req.path, email: decoded.email, role: decoded.role }, '[Auth Middleware] Access Denied: Missing or invalid token claims.');
      res.status(403).json({ error: 'Access Denied: Missing or invalid token claims.' });
      return;
    }

    // Verify user still exists in database (Deleted User Protection)
    const dbUser = await dbService.client.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    if (!dbUser) {
      logger.warn({ userId, ip: req.ip, event: 'SECURITY_ACCESS_DENIED' }, '[Auth Middleware] Access Denied: User no longer exists in database.');
      res.status(403).json({ error: 'Access Denied: User no longer exists.' });
      return;
    }

    req.user = {
      id: userId,
      email: decoded.email,
    };
    next();
  } catch (error) {
    logger.error(error, '[Auth Middleware] JWT token verification failed:');
    res.status(403).json({ error: 'Access Denied: Invalid or expired token.' });
  }

}
