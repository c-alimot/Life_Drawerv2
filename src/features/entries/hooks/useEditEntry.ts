import { useState, useCallback } from 'react';
import { useAuthStore } from '@store';

export function useEditEntry(entryId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuthStore();

  const updateEntry = useCallback(
    async (data: any) => {
      if (!session?.user?.id) return false;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/entries/${entryId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(data),
          }
        );
        return response.ok;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [session, entryId]
  );

  return { isLoading, error, updateEntry };
}