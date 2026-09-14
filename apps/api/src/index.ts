import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env relative to current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { logger } from './config/logger.js';
import { seedInitialData } from './seed.js';

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await connectDB();
    await seedInitialData();

    const app = createApp();

    const server = app.listen(PORT, () => {
      logger.info(`Support Hub API server listening on http://localhost:${PORT}`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server gracefully...');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error({ error }, 'Failed to start API server');
    process.exit(1);
  }
}

startServer();
