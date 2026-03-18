import { useState, useCallback } from 'react';
import { useAuthStore } from '@store';
import { drawersApi } from '../api/drawers.api';
import type { UpdateDrawerRequest, ApiError, Drawer } from '@types';

export function useUpdateDrawer() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const updateDrawer = useCallback(
    async (drawerId: string, data: UpdateDrawerRequest): Promise<Drawer | null> => {
      if (!user) return null;

      setIsLoading(true);
      setError(null);

      try {
        const result = await drawersApi.updateDrawer(drawerId, user.id, data);

        if (!result.success || !result.data) {
          setError(
            result.error || {
              code: 'UNKNOWN_ERROR',
              message: 'Failed to update drawer',
            }
          );
          return null;
        }

        return result.data;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error('Update drawer error:', apiError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    updateDrawer,
    isLoading,
    error,
  };
}