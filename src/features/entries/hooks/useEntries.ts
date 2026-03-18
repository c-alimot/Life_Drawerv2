import { useState, useCallback } from 'react';
import { useAuthStore } from '@store';
import { entriesApi } from '../api/entries.api';
import type { EntryWithRelations, SearchEntriesRequest, ApiError } from '@types';

export function useEntries(initialRequest?: SearchEntriesRequest) {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchEntries = useCallback(
    async (request?: SearchEntriesRequest) => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await entriesApi.getEntries(user.id, request);

        if (!result.success || !result.data) {
          setError(
            result.error || { code: 'UNKNOWN_ERROR', message: 'Failed to fetch entries' }
          );
          return;
        }

        setEntries(result.data.entries);
        setTotal(result.data.total);
        setHasMore(result.data.hasMore);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error('Fetch entries error:', apiError);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const fetchRecentEntries = useCallback(
    async (limit?: number) => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await entriesApi.getRecentEntries(user.id, limit);

        if (!result.success || !result.data) {
          setError(
            result.error || { code: 'UNKNOWN_ERROR', message: 'Failed to fetch recent entries' }
          );
          return;
        }

        setEntries(result.data.entries);
        setTotal(result.data.total);
        setHasMore(result.data.hasMore);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error('Fetch recent entries error:', apiError);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const fetchSingleEntry = useCallback(
    async (entryId: string) => {
      if (!user) return null;

      setIsLoading(true);
      setError(null);

      try {
        const result = await entriesApi.getEntry(entryId, user.id);

        if (!result.success || !result.data) {
          setError(
            result.error || { code: 'UNKNOWN_ERROR', message: 'Failed to fetch entry' }
          );
          return null;
        }

        return result.data;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error('Fetch single entry error:', apiError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    entries,
    isLoading,
    error,
    total,
    hasMore,
    fetchEntries,
    fetchRecentEntries,
    fetchSingleEntry,
  };
}