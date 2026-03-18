import { drawersService } from '@services';
import {
  CreateDrawerRequest,
  UpdateDrawerRequest,
  ApiError,
} from '@types';

export const drawersApi = {
  async createDrawer(userId: string, data: CreateDrawerRequest) {
    try {
      const result = await drawersService.createDrawer(userId, data);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error('Drawers API create error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async getDrawers(userId: string) {
    try {
      const result = await drawersService.getDrawers(userId);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error('Drawers API get error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async getDrawer(drawerId: string, userId: string) {
    try {
      const result = await drawersService.getDrawerById(drawerId, userId);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error('Drawers API get single error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async getDrawerEntries(drawerId: string, userId: string, limit?: number, offset?: number) {
    try {
      const result = await drawersService.getDrawerEntries(
        drawerId,
        userId,
        limit,
        offset
      );
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error('Drawers API get entries error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async updateDrawer(drawerId: string, userId: string, data: UpdateDrawerRequest) {
    try {
      const result = await drawersService.updateDrawer(drawerId, userId, data);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error('Drawers API update error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async deleteDrawer(drawerId: string, userId: string) {
    try {
      await drawersService.deleteDrawer(drawerId, userId);
      return {
        success: true,
        data: null,
        error: null,
      };
    } catch (error) {
      console.error('Drawers API delete error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },
};