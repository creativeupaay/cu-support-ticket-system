import { Request, Response, NextFunction } from 'express';
import { Project, ProjectDocument } from '../models/Project.js';
import { AppError } from './errorHandler.js';
import { logger } from '../config/logger.js';

declare global {
  namespace Express {
    interface Request {
      project?: ProjectDocument;
    }
  }
}

export async function validateProjectAndOrigin(req: Request, res: Response, next: NextFunction) {
  const { projectKey } = req.params;

  if (!projectKey) {
    return next(new AppError(400, 'MISSING_PROJECT_KEY', 'projectKey URL parameter is required'));
  }

  try {
    const project = await Project.findOne({ projectKey });
    if (!project) {
      return next(new AppError(404, 'PROJECT_NOT_FOUND', `Project with key '${projectKey}' not found`));
    }

    // Origin verification
    const rawOrigin = req.headers.origin || req.headers.referer;

    // In non-production or if allowedDomains is empty / wildcard, allow all
    const isDev = process.env.NODE_ENV !== 'production';
    const allowWildcard = project.allowedDomains.includes('*') || project.allowedDomains.length === 0;

    if (!allowWildcard && rawOrigin) {
      try {
        const originUrl = new URL(rawOrigin);
        const originHost = originUrl.origin; // e.g. "https://clientapp.com" or "http://localhost:5173"

        const isAllowed = project.allowedDomains.some((domain) => {
          if (!domain) return false;
          // Exact match
          if (domain === originHost || domain === originUrl.hostname) return true;
          // Normalised comparison
          try {
            const parsedAllowed = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
            return parsedAllowed.origin === originHost || parsedAllowed.hostname === originUrl.hostname;
          } catch {
            return domain === originUrl.hostname;
          }
        });

        // Always allow localhost in dev
        const isLocalhost = isDev && (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1');

        if (!isAllowed && !isLocalhost) {
          logger.warn(
            { origin: rawOrigin, projectKey, allowedDomains: project.allowedDomains },
            'Rejected request: Origin not allowed'
          );
          return next(
            new AppError(403, 'FORBIDDEN_ORIGIN', 'Origin is not permitted to submit tickets for this project')
          );
        }
      } catch (err) {
        logger.warn({ rawOrigin, err }, 'Failed to parse Origin/Referer header');
      }
    }

    // Attach project to request for downstream handlers
    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
}
