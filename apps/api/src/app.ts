import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { logger } from './config/logger.js';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { ticketsRouter } from './routes/tickets.js';
import { publicRouter } from './routes/public.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Logging
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === '/health',
      },
    })
  );

  // Security Headers (configured to permit iframe embedding of widget)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      frameguard: false, // allow iframe embedding
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // In development or when origin is absent (mobile/postman/scripts), allow
        callback(null, true);
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health Check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/public/v1', publicRouter);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      },
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
