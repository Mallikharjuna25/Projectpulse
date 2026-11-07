import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { DeadlineJob } from './jobs/deadlineJob.js';
import { ensureSuperAdmin } from './utils/bootstrap.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  try {
    // 1. Connect to Database & Bootstrap primary super admin if blank DB
    await connectDB();
    await ensureSuperAdmin();

    // 2. Initialize Express application
    const app = createApp();

    // 3. Create HTTP server & Socket.IO
    const httpServer = http.createServer(app);
    initSocket(httpServer);

    // 4. Initialize scheduled jobs (deadline & overdue monitor)
    DeadlineJob.initDeadlineCron();

    // 5. Start listening
    const port = env.PORT;
    httpServer.listen(port, () => {
      logger.info(`========================================================`);
      logger.info(` ProjectPulse Backend API listening on port ${port} `);
      logger.info(` Environment: ${env.NODE_ENV} | URL: http://localhost:${port} `);
      logger.info(` Socket.IO real-time gateway initialized `);
      logger.info(`========================================================`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      httpServer.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start ProjectPulse server', err);
    process.exit(1);
  }
};

startServer();

