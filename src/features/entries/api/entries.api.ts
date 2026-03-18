import { entriesService } from '@services';
import {
  CreateEntryRequest,
  UpdateEntryRequest,
  SearchEntriesRequest,
  ApiError,
} from '@types';

export const entriesApi = {
  async createEntry(userId: string, data: CreateEntryRequest) {
    try {
      const result = await entriesService.createEntry(userId, data);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error('Entries API create error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async getEntries(userId: string, request?: SearchEntriesRequest) {
    try {
      const result = await entriesService.getEntries(userId, request);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error('Entries API get error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async getEntry(entryId: string, userId: string) {
    try {
      const result = await entriesService.getEntryById(entryId, userId);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error('Entries API get single error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async getRecentEntries(userId: string, limit?: number) {
    try {
      const result = await entriesService.getRecentEntries(userId, limit);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error('Entries API get recent error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async updateEntry(entryId: string, userId: string, data: UpdateEntryRequest) {
    try {
      const result = await entriesService.updateEntry(entryId, userId, data);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error('Entries API update error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async deleteEntry(entryId: string, userId: string) {
    try {
      await entriesService.deleteEntry(entryId, userId);
      return {
        success: true,
        data: null,
        error: null,
      };
    } catch (error) {
      console.error('Entries API delete error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async linkToDrawer(entryId: string, drawerId: string) {
    try {
      await entriesService.linkEntryToDrawer(entryId, drawerId);
      return {
        success: true,
        data: null,
        error: null,
      };
    } catch (error) {
      console.error('Entries API link to drawer error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async unlinkFromDrawer(entryId: string, drawerId: string) {
    try {
      await entriesService.unlinkEntryFromDrawer(entryId, drawerId);
      return {
        success: true,
        data: null,
        error: null,
      };
    } catch (error) {
      console.error('Entries API unlink from drawer error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async linkToTag(entryId: string, tagId: string) {
    try {
      await entriesService.linkEntryToTag(entryId, tagId);
      return {
        success: true,
        data: null,
        error: null,
      };
    } catch (error) {
      console.error('Entries API link to tag error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async unlinkFromTag(entryId: string, tagId: string) {
    try {
      await entriesService.unlinkEntryFromTag(entryId, tagId);
      return {
        success: true,
        data: null,
        error: null,
      };
    } catch (error) {
      console.error('Entries API unlink from tag error:', error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },
};