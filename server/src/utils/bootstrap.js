import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { logger } from './logger.js';

/**
 * Ensures at least one Platform Super Admin exists on a clean database installation.
 * This ensures that a brand new production database with zero seed or mock data
 * is immediately operational and administrative onboarding can begin.
 */
export const ensureSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await User.findOne({ globalRole: 'SUPER_ADMIN' });
    if (!existingSuperAdmin) {
      const email = env.SUPER_ADMIN_EMAIL.toLowerCase();
      const password = env.SUPER_ADMIN_PASSWORD;

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      await User.create({
        name: 'Platform Administrator',
        email,
        passwordHash,
        globalRole: 'SUPER_ADMIN',
        collegeId: null,
        isEmailVerified: true,
        isActive: true
      });

      logger.info(`[BOOTSTRAP] Initialized primary Super Admin account: ${email}`);
    }
  } catch (err) {
    logger.error('[BOOTSTRAP] Failed to ensure Super Admin exists:', err);
  }
};

