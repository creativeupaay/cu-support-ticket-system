import mongoose from 'mongoose';
import { logger } from './logger.js';

let mongod: any = null;

export async function connectDB(uri?: string): Promise<string> {
  const targetUri = uri || process.env.MONGODB_URI;

  if (targetUri && targetUri.trim() !== '') {
    try {
      logger.info({ uri: targetUri.replace(/:\/\/.*@/, '://***:***@') }, 'Connecting to MongoDB...');
      await mongoose.connect(targetUri, {
        serverSelectionTimeoutMS: 3000,
      });
      logger.info('Connected to MongoDB database');
      return targetUri;
    } catch (err) {
      logger.warn({ err }, 'Failed to connect to provided MONGODB_URI. Falling back to in-memory MongoDB...');
    }
  }

  // Fallback to in-memory mongodb for seamless local dev & test
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    logger.info({ uri: memoryUri }, 'Starting in-memory MongoDB server for development...');
    await mongoose.connect(memoryUri);
    logger.info('Connected to in-memory MongoDB database');
    return memoryUri;
  } catch (error) {
    logger.error({ error }, 'Fatal: Could not connect to external or in-memory MongoDB');
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}
