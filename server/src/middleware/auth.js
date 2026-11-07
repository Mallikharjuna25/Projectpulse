import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/User.js';

/**
 * Authentication middleware.
 * Verifies Bearer JWT access token from Authorization header,
 * loads current user from DB, and checks active status.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required',
        data: null,
        errors: null
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists',
        data: null,
        errors: null
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Contact your administrator.',
        data: null,
        errors: null
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired',
        data: null,
        errors: { code: 'TOKEN_EXPIRED' }
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid access token',
      data: null,
      errors: null
    });
  }
};

