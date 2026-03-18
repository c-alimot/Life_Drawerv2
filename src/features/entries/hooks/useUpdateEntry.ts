import { useState, useCallback } from 'react';
import { useAuthStore } from '@store';
import { entriesApi } from '../api/entries.api';
import type { UpdateEntryRequest, ApiError } from '@types';

export function useUpdateEntry() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const updateEntry = useCallback(
    async (entryId: string, data: UpdateEntryRequest) => {
      if (!user) return null;

      setIsLoading(true);
      setError(null);

      try {
        const result = await entriesApi.updateEntry(entryId, user.id, data);

        if (!result.success || !result.data) {
          setError(
            result.error || { code: 'UNKNOWN_ERROR', message: 'Failed to update entry' }
          );
          return null;
        }

        return result.data;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error('Update entry error:', apiError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    updateEntry,
    isLoading,
    error,
  };
}