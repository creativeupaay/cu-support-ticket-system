import mongoose from 'mongoose';
import { logger } from './logger.js';

let mongod: any = null;

export async function connectDB(uri?: string): Promise<string> {
  const targetUri = uri || process.env.MONGODB_URI;
  const isProduction = process.env.NODE_ENV === 'production';

  if (targetUri && targetUri.trim() !== '') {
    try {
      logger.info({ uri: targetUri.replace(/:\/\/.*@/, '://***:***@') }, 'Connecting to MongoDB...');
      await mongoose.connect(targetUri, {
        serverSelectionTimeoutMS: 10000,
      });
      logger.info('Connected to MongoDB database');
      return targetUri;
    } catch (err: any) {
      logger.error({ err: err?.message || err }, 'Failed to connect to provided MONGODB_URI');
      if (isProduction) {
        throw new Error(`MongoDB connection failed in production: ${err?.message || err}`);
      }
      logger.warn('Falling back to in-memory MongoDB for local development...');
    }
  }

  if (isProduction) {
    throw new Error('Fatal: MONGODB_URI environment variable is missing or failed to connect in production environment.');
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
