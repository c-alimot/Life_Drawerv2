import { useState, useCallback } from 'react';
import { useAuthStore } from '@store';
import { drawersApi } from '../api/drawers.api';
import type { CreateDrawerRequest, ApiError, Drawer } from '@types';

export function useCreateDrawer() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const createDrawer = useCallback(
    async (data: CreateDrawerRequest): Promise<Drawer | null> => {
      if (!user) return null;

      setIsLoading(true);
      setError(null);

      try {
        const result = await drawersApi.createDrawer(user.id, data);

        if (!result.success || !result.data) {
          setError(
            result.error || {
              code: 'UNKNOWN_ERROR',
              message: 'Failed to create drawer',
            }
          );
          return null;
        }

        return result.data;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error('Create drawer error:', apiError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    createDrawer,
    isLoading,
    error,
  };
}