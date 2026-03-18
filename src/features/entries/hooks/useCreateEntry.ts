import { useState, useCallback } from 'react';
import { useAuthStore } from '@store';
import { entriesApi } from '../api/entries.api';
import type { CreateEntryRequest, ApiError } from '@types';

export function useCreateEntry() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const createEntry = useCallback(
    async (data: CreateEntryRequest) => {
      if (!user) return null;

      setIsLoading(true);
      setError(null);

      try {
        const result = await entriesApi.createEntry(user.id, data);

        if (!result.success || !result.data) {
          setError(
            result.error || { code: 'UNKNOWN_ERROR', message: 'Failed to create entry' }
          );
          return null;
        }

        return result.data;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error('Create entry error:', apiError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    createEntry,
    isLoading,
    error,
  };
}