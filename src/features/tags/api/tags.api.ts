import { tagsService } from "@services/supabase/tags";
import { ApiError, CreateTagRequest, UpdateTagRequest } from "@types";

export const tagsApi = {
  async createTag(userId: string, data: CreateTagRequest) {
    try {
      const result = await tagsService.createTag(userId, data);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error("Tags API create error:", error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async getTags(userId: string) {
    try {
      const result = await tagsService.getTags(userId);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error("Tags API get error:", error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async getTag(tagId: string, userId: string) {
    try {
      const result = await tagsService.getTagById(tagId, userId);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error("Tags API get single error:", error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async deleteTag(tagId: string, userId: string) {
    try {
      await tagsService.deleteTag(tagId, userId);
      return {
        success: true,
        data: null,
        error: null,
      };
    } catch (error) {
      console.error("Tags API delete error:", error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async updateTag(tagId: string, userId: string, data: UpdateTagRequest) {
    try {
      const result = await tagsService.updateTag(tagId, userId, data);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      console.error("Tags API update error:", error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },

  async searchTags(userId: string, query: string) {
    try {
      const result = await tagsService.searchTags(userId, query);
      return {
        success: true,
        data: { tags: result },
        error: null,
      };
    } catch (error) {
      console.error("Tags API search error:", error);
      return {
        success: false,
        data: null,
        error: error as ApiError,
      };
    }
  },
};
