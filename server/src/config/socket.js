import { Server } from 'socket.io';
import { corsOptions } from './cors.js';
import { verifyAccessToken } from '../utils/token.js';
import { logger } from '../utils/logger.js';

let ioInstance = null;

/**
 * Initialize Socket.IO server with JWT authentication.
 */
export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: corsOptions,
    pingTimeout: 60000
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      logger.warn(`Socket authentication error: ${err.message}`);
      next(new Error('Invalid or expired socket authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, collegeId } = socket.user;
    logger.info(`Socket client connected: ${socket.id} (User: ${userId})`);

    // Automatically join user-specific room
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Automatically join college room
    if (collegeId) {
      socket.join(`college:${collegeId}`);
    }

    // Handle joining project-specific rooms dynamically
    socket.on('project:join', (projectId) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
        logger.debug(`Socket ${socket.id} joined project room: project:${projectId}`);
      }
    });

    socket.on('project:leave', (projectId) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
        logger.debug(`Socket ${socket.id} left project room: project:${projectId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket client disconnected: ${socket.id} (${reason})`);
    });
  });

  ioInstance = io;
  return io;
};

/**
 * Get active Socket.IO server instance.
 */
export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized yet');
  }
  return ioInstance;
};

