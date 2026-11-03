import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import {
  RegisterDto,
  RegisterShopDto,
  LoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  GoogleAuthDto,
} from './auth.dto.js';
import { sendSuccess } from '../../utils/responseEnvelope.js';
import { env } from '../../config/env.js';

export const authController = {
  /**
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = RegisterDto.parse(req.body);
      const result = await authService.registerUser(validatedData);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/register-shop
   */
  async registerShop(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = RegisterShopDto.parse(req.body);
      const result = await authService.registerShop(validatedData);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/verify-email
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = VerifyEmailDto.parse(req.body);
      const result = await authService.verifyEmail(validatedData);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/resend-verification
   */
  async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = ResendVerificationDto.parse(req.body);
      const result = await authService.resendVerification(validatedData.email);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = LoginDto.parse(req.body);
      const result = await authService.login(validatedData);

      // Thiết lập Cookie HttpOnly bảo mật cho Refresh Token
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: result.maxAgeMs,
      });

      // Trả về JSON Body chứa Access Token (15m) và User Profile
      sendSuccess(
        res,
        {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
          user: result.user,
        },
        200
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/refresh-token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken;
      const result = await authService.refreshToken(token);

      // Cập nhật Cookie với Refresh Token mới (Rotation)
      res.cookie('refreshToken', result.newRefreshToken, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: result.maxAgeMs,
      });

      sendSuccess(
        res,
        {
          accessToken: result.newAccessToken,
          expiresIn: result.expiresIn,
        },
        200
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken;
      const result = await authService.logout(token);

      // Xóa Cookie Refresh Token
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: 0,
      });

      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/auth/me
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const profile = await authService.getProfile(userId);
      sendSuccess(res, profile, 200);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = ForgotPasswordDto.parse(req.body);
      const result = await authService.forgotPassword(validatedData.email);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = ResetPasswordDto.parse(req.body);
      const result = await authService.resetPassword(validatedData);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/google
   */
  async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = GoogleAuthDto.parse(req.body);
      const result = await authService.loginWithGoogle(validatedData);

      // Thiết lập Cookie HttpOnly
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      sendSuccess(
        res,
        {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
          user: result.user,
        },
        200
      );
    } catch (error) {
      next(error);
    }
  },
};
