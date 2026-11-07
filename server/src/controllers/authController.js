import { AuthService } from '../services/authService.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

const REFRESH_COOKIE_NAME = 'projectpulse_refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export class AuthController {
  static register = asyncHandler(async (req, res) => {
    const result = await AuthService.registerStudent(req.body);
    return apiResponse.success(
      res,
      'Registration successful. Please verify your email to log in.',
      result,
      201
    );
  });

  static login = asyncHandler(async (req, res) => {
    const { email, password, rememberMe } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.login(
      email,
      password,
      rememberMe
    );

    const maxAge = rememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...cookieOptions,
      maxAge
    });

    return apiResponse.success(res, 'Login successful', {
      user,
      accessToken
    });
  });

  static refresh = asyncHandler(async (req, res) => {
    const incomingToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    const { user, accessToken, refreshToken } = await AuthService.refreshSession(incomingToken);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);

    return apiResponse.success(res, 'Session refreshed successfully', {
      user,
      accessToken
    });
  });

  static logout = asyncHandler(async (req, res) => {
    if (req.user?._id) {
      await AuthService.logout(req.user._id);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
    return apiResponse.success(res, 'Logged out successfully');
  });

  static verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;
    const result = await AuthService.verifyEmail(token);
    return apiResponse.success(res, result.message);
  });

  static forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await AuthService.forgotPassword(email);
    return apiResponse.success(res, result.message, { resetToken: result.resetToken });
  });

  static resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const result = await AuthService.resetPassword(token, password);
    res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
    return apiResponse.success(res, result.message);
  });

  static getMe = asyncHandler(async (req, res) => {
    const user = await AuthService.getMe(req.user._id);
    return apiResponse.success(res, 'User profile retrieved', { user });
  });

  static updateMe = asyncHandler(async (req, res) => {
    const user = await AuthService.updateProfile(req.user._id, req.body);
    return apiResponse.success(res, 'Profile updated successfully', { user });
  });
}

