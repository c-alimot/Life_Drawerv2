import { useCallback, useState } from "react";
import { useAuthStore } from "@store";
import type { ApiError } from "@types";
import { tagsApi } from "../api/tags.api";

export function useDeleteTag() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const deleteTag = useCallback(
    async (tagId: string): Promise<boolean> => {
      if (!user) return false;

      setIsLoading(true);
      setError(null);

      try {
        const result = await tagsApi.deleteTag(tagId, user.id);

        if (!result.success) {
          setError(
            result.error || {
              code: "UNKNOWN_ERROR",
              message: "Failed to delete tag",
            },
          );
          return false;
        }

        return true;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error("Delete tag error:", apiError);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  return {
    deleteTag,
    isLoading,
    error,
  };
}
