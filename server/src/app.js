import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { corsMiddleware } from './config/cors.js';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import collegeRoutes from './routes/collegeRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import { standaloneTaskRouter } from './routes/taskRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import { facultyRouter } from './routes/supervisionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';

export const createApp = () => {
  const app = express();

  // 1. Security HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows flexible integration in dev/dashboard views
      crossOriginEmbedderPolicy: false
    })
  );

  // 2. CORS handling
  app.use(corsMiddleware);

  // 3. Request body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Cookie parsing
  app.use(cookieParser(env.COOKIE_SECRET));

  // 5. Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // 6. Prevent HTTP Parameter Pollution
  app.use(hpp());

  // 7. General API Rate Limiting (active in dev/production, disabled in test mode)
  if (env.NODE_ENV !== 'test') {
    const generalLimiter = rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
      max: env.RATE_LIMIT_MAX ? Math.max(env.RATE_LIMIT_MAX, 1000) : 1000,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later',
        data: null,
        errors: { code: 'RATE_LIMIT_EXCEEDED' }
      }
    });
    app.use('/api', generalLimiter);
  }

  // 8. Request logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // 8. Static file serving for uploads (local disk storage)
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads')));

  // 9. Health check
  app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'ProjectPulse API is healthy and operational',
      data: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV
      },
      errors: null
    });
  });

  // 9. API Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1', collegeRoutes);
  app.use('/api/v1/admin', departmentRoutes);
  app.use('/api/v1', userRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/tasks', standaloneTaskRouter);
  app.use('/api/v1/calendar', calendarRoutes);
  app.use('/api/v1/faculty', facultyRouter);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/announcements', announcementRoutes);

  // 10. 404 & Central Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

