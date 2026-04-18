import { useState, useCallback } from 'react';
import { useAuthStore } from '@store';
import { drawersApi } from '../api/drawers.api';
import type { Drawer, ApiError } from '@types';

export function useDrawers() {
  const { user } = useAuthStore();
  const [drawers, setDrawers] = useState<(Drawer & { entryCount: number })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [total, setTotal] = useState(0);

  const fetchDrawers = useCallback(async () => {
    if (!user) return;

    if (!drawers.length) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await drawersApi.getDrawers(user.id);

      if (!result.success || !result.data) {
        setError(
          result.error || {
            code: 'UNKNOWN_ERROR',
            message: 'Failed to fetch drawers',
          }
        );
        return;
      }

      setDrawers(result.data.drawers);
      setTotal(result.data.total);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Fetch drawers error:', apiError);
    } finally {
      setIsLoading(false);
    }
  }, [drawers.length, user]);

  const fetchSingleDrawer = useCallback(
    async (drawerId: string) => {
      if (!user) return null;

      setIsLoading(true);
      setError(null);

      try {
        const result = await drawersApi.getDrawer(drawerId, user.id);

        if (!result.success || !result.data) {
          setError(
            result.error || {
              code: 'UNKNOWN_ERROR',
              message: 'Failed to fetch drawer',
            }
          );
          return null;
        }

        return result.data;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error('Fetch single drawer error:', apiError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    drawers,
    isLoading,
    error,
    total,
    fetchDrawers,
    fetchSingleDrawer,
  };
}
