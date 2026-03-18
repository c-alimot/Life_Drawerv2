import { useState, useCallback } from 'react';
import { useAuthStore } from '@store';
import { entriesApi } from '../api/entries.api';
import type { ApiError } from '@types';

export function useDeleteEntry() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const deleteEntry = useCallback(
    async (entryId: string) => {
      if (!user) return false;

      setIsLoading(true);
      setError(null);

      try {
        const result = await entriesApi.deleteEntry(entryId, user.id);

        if (!result.success) {
          setError(
            result.error || { code: 'UNKNOWN_ERROR', message: 'Failed to delete entry' }
          );
          return false;
        }

        return true;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error('Delete entry error:', apiError);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    deleteEntry,
    isLoading,
    error,
  };
}