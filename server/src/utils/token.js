import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Generate a short-lived JWT Access Token.
 * @param {Object} payload { userId, collegeId, globalRole }
 * @returns {string}
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY
  });
};

/**
 * Verify a JWT Access Token.
 * @param {string} token
 * @returns {Object} decoded payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
};

/**
 * Generate a cryptographically secure random refresh token string.
 * @returns {string} 64-byte hex string
 */
export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Hash a token using SHA-256 for secure storage in database.
 * @param {string} token
 * @returns {string}
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate random token for email verification or password reset.
 * @returns {Object} { rawToken, hashedToken, expiresAt }
 */
export const generateOpaqueToken = (expiresInMs = 3600000) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + expiresInMs);
  return { rawToken, hashedToken, expiresAt };
};

