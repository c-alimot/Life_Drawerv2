import { useAuthStore } from "@store";
import type { ApiError, Tag } from "@types";
import { useCallback, useState } from "react";
import { tagsApi } from "../api/tags.api";

export function useTags() {
  const { user } = useAuthStore();
  const [tags, setTags] = useState<(Tag & { entryCount: number })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [total, setTotal] = useState(0);

  const fetchTags = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await tagsApi.getTags(user.id);

      if (!result.success || !result.data) {
        setError(
          result.error || {
            code: "UNKNOWN_ERROR",
            message: "Failed to fetch tags",
          },
        );
        return;
      }

      setTags(result.data.tags);
      setTotal(result.data.total);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error("Fetch tags error:", apiError);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    tags,
    setTags,
    isLoading,
    error,
    total,
    fetchTags,
  };
}
