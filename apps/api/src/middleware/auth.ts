import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export interface AuthenticatedAgent {
  agentId: string;
  organizationId: string;
  email: string;
  role: 'owner' | 'admin' | 'agent';
}

declare global {
  namespace Express {
    interface Request {
      agent?: AuthenticatedAgent;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header'));
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

  try {
    const payload = jwt.verify(token, jwtSecret) as AuthenticatedAgent;
    req.agent = {
      agentId: payload.agentId,
      organizationId: payload.organizationId,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (error) {
    return next(new AppError(401, 'INVALID_TOKEN', 'Token is expired or invalid'));
  }
}
