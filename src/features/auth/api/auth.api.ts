import { authService } from '@services';
import { SignupRequest, LoginRequest, ApiError } from '@types';

export const authApi = {
  /**
   * Sign up a new user
   */
  async signup(data: SignupRequest) {
    try {
      const result = await authService.signup(data);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error('Auth API signup error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  /**
   * Login user
   */
  async login(data: LoginRequest) {
    try {
      const result = await authService.login(data);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error('Auth API login error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  /**
   * Get current session
   */
  async getSession() {
    try {
      const result = await authService.getSession();
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error('Auth API get session error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  /**
   * Refresh session
   */
  async refreshSession() {
    try {
      const result = await authService.refreshSession();
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error('Auth API refresh session error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await authService.logout();
      return {
        success: true,
        data: null,
        error: null,
      };
    } catch (error) {
      console.error('Auth API logout error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async resetPassword(email: string) {
    try {
      await authService.resetPassword(email);
      return {
        success: true,
        data: null,
        error: null,
      };
    } catch (error) {
      console.error("Auth API reset password error:", error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: { displayName?: string; avatarUrl?: string },
  ) {
    try {
      const result = await authService.updateProfile(userId, updates);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error('Auth API update profile error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async uploadProfilePhoto(userId: string, uri: string) {
    try {
      const result = await authService.uploadProfilePhoto(userId, uri);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error("Auth API upload profile photo error:", error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },
};
