import { useState, useCallback } from 'react';
import { useAuthStore } from '@store';
import { lifePhaseService, type LifePhase } from '@services/supabase/lifePhases';
import type { ApiError } from '@types';

export function useLifePhase() {
  const { user } = useAuthStore();
  const [activePhase, setActivePhase] = useState<LifePhase | null>(null);
  const [phases, setPhases] = useState<LifePhase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchActivePhase = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const phase = await lifePhaseService.getActiveLifePhase(user.id);
      setActivePhase(phase);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Fetch active phase error:', apiError);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchAllPhases = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const allPhases = await lifePhaseService.getLifePhases(user.id);
      setPhases(allPhases);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Fetch all phases error:', apiError);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createPhase = useCallback(
    async (data: { name: string; description?: string; startDate?: string }) => {
      if (!user) return null;

      setIsLoading(true);
      setError(null);

      try {
        const newPhase = await lifePhaseService.createLifePhase(user.id, data);
        setActivePhase(newPhase);
        setPhases((prev) => [newPhase, ...prev]);
        return newPhase;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error('Create phase error:', apiError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const setActivePhaseById = useCallback(
    async (phaseId: string) => {
      if (!user) return null;

      setIsLoading(true);
      setError(null);

      try {
        const phase = await lifePhaseService.setActiveLifePhase(phaseId, user.id);
        setActivePhase(phase);
        return phase;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error('Set active phase error:', apiError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    activePhase,
    phases,
    isLoading,
    error,
    fetchActivePhase,
    fetchAllPhases,
    createPhase,
    setActivePhaseById,
  };
}