import { useState, useCallback } from 'react';
import { useAuthStore } from '@store';
import { drawersApi } from '../api/drawers.api';
import type { Entry, ApiError } from '@types';

export function useDrawerEntries(drawerId: string) {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchEntries = useCallback(
    async (limit: number = 20, offset: number = 0) => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await drawersApi.getDrawerEntries(
          drawerId,
          user.id,
          limit,
          offset
        );

        if (!result.success || !result.data) {
          setError(
            result.error || {
              code: 'UNKNOWN_ERROR',
              message: 'Failed to fetch drawer entries',
            }
          );
          return;
        }

        setEntries(result.data.entries);
        setTotal(result.data.total);
        setHasMore(result.data.hasMore);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error('Fetch drawer entries error:', apiError);
      } finally {
        setIsLoading(false);
      }
    },
    [drawerId, user]
  );

  return {
    entries,
    isLoading,
    error,
    total,
    hasMore,
    fetchEntries,
  };
}