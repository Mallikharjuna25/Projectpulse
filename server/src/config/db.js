import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Configure public DNS servers to resolve MongoDB Atlas SRV records on Windows/local networks
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (dnsErr) {
  // Ignore if unsupported in environment
}

let memoryServerInstance = null;

/**
 * Connect to MongoDB with automatic fallback to in-memory instance for testing/local dev.
 */
export const connectDB = async () => {
  try {
    const mongoUri = env.MONGO_URI;
    if (mongoUri.includes('<db_username>') || mongoUri.includes('<db_password>')) {
      logger.warn('[MONGODB CONFIG] MONGO_URI contains literal "<db_username>" or "<db_password>". Please replace them with your actual MongoDB Atlas database username and password in server/.env');
    }
    logger.info(`Attempting MongoDB connection to: ${mongoUri.replace(/:[^:]*@/, ':****@')}`);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });

    logger.info(`MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    logger.warn(`Direct MongoDB connection failed: ${err.message}. Initializing MongoMemoryServer fallback...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const inMemoryUri = memoryServerInstance.getUri();
      logger.info(`In-memory MongoDB started at: ${inMemoryUri}`);

      await mongoose.connect(inMemoryUri);
      logger.info('Connected to In-Memory MongoDB successfully.');
    } catch (fallbackErr) {
      logger.error('Failed to initialize MongoDB connection or MongoMemoryServer fallback', fallbackErr);
      throw fallbackErr;
    }
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection runtime error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
};

/**
 * Disconnect and cleanup DB connections (useful in tests and graceful shutdown).
 */
export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
  logger.info('MongoDB disconnected.');
};

