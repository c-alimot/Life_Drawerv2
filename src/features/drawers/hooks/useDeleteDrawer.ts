import { useState, useCallback } from 'react';
import { useAuthStore } from '@store';
import { drawersApi } from '../api/drawers.api';
import type { ApiError } from '@types';

export function useDeleteDrawer() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const deleteDrawer = useCallback(
    async (drawerId: string): Promise<boolean> => {
      if (!user) return false;

      setIsLoading(true);
      setError(null);

      try {
        const result = await drawersApi.deleteDrawer(drawerId, user.id);

        if (!result.success) {
          setError(
            result.error || {
              code: 'UNKNOWN_ERROR',
              message: 'Failed to delete drawer',
            }
          );
          return false;
        }

        return true;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error('Delete drawer error:', apiError);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    deleteDrawer,
    isLoading,
    error,
  };
}