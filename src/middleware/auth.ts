import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import { UserRole } from '../models/User';

/**
 * JWT Payload interface.
 * Per spec: ONLY user metadata (id, role) — NO balance or email.
 */
export interface JwtPayload {
  id: bigint;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Augment Express Request to carry the decoded JWT payload
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Proxy Pattern — authenticateJWT middleware.
 * Intercepts every request and validates the Bearer token in the Authorization header.
 * Attaches decoded payload to req.user on success.
 */
export const authenticateJWT = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = authHeader.slice(7);

  try {
    const publicKey = (process.env.JWT_PUBLIC_KEY || '').replace(/\\n/g, '\n');
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired JWT'));
  }
};

/**
 * Proxy Pattern — authorizeRole middleware.
 * Enforces Role-Based Access Control (RBAC) by checking req.user.role against allowed roles.
 */
export const authorizeRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions for this resource'));
    }
    next();
  };
