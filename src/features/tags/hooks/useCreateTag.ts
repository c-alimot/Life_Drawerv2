import { useAuthStore } from "@store";
import type { ApiError, CreateTagRequest, Tag } from "@types";
import { useCallback, useState } from "react";
import { tagsApi } from "../api/tags.api";

export function useCreateTag() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const createTag = useCallback(
    async (data: CreateTagRequest): Promise<Tag | null> => {
      if (!user) return null;

      setIsLoading(true);
      setError(null);

      try {
        const result = await tagsApi.createTag(user.id, data);

        if (!result.success || !result.data) {
          setError(
            result.error || {
              code: "UNKNOWN_ERROR",
              message: "Failed to create tag",
            },
          );
          return null;
        }

        return result.data;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error("Create tag error:", apiError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  return {
    createTag,
    isLoading,
    error,
  };
}
