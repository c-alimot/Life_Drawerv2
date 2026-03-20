import { useState, useCallback } from 'react';
import { useAuthStore } from '@store';
import { entriesService } from '@services/supabase/entries';
import type { EntryWithRelations, UpdateEntryRequest, ApiError } from '@types';

export function useEditEntry(entryId: string) {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const updateEntry = useCallback(
    async (data: UpdateEntryRequest) => {
      if (!user) return null;

      setIsLoading(true);
      setError(null);

      try {
        const result = await entriesService.updateEntry(entryId, user.id, data);
        return result;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error('Update entry error:', apiError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [entryId, user]
  );

  const linkDrawer = useCallback(
    async (drawerId: string) => {
      if (!user) return false;

      try {
        await entriesService.linkEntryToDrawer(entryId, drawerId);
        return true;
      } catch (err) {
        console.error('Link drawer error:', err);
        return false;
      }
    },
    [entryId, user]
  );

  const unlinkDrawer = useCallback(
    async (drawerId: string) => {
      try {
        await entriesService.unlinkEntryFromDrawer(entryId, drawerId);
        return true;
      } catch (err) {
        console.error('Unlink drawer error:', err);
        return false;
      }
    },
    [entryId]
  );

  const linkTag = useCallback(
    async (tagId: string) => {
      if (!user) return false;

      try {
        await entriesService.linkEntryToTag(entryId, tagId);
        return true;
      } catch (err) {
        console.error('Link tag error:', err);
        return false;
      }
    },
    [entryId, user]
  );

  const unlinkTag = useCallback(
    async (tagId: string) => {
      try {
        await entriesService.unlinkEntryFromTag(entryId, tagId);
        return true;
      } catch (err) {
        console.error('Unlink tag error:', err);
        return false;
      }
    },
    [entryId]
  );

  return {
    isLoading,
    error,
    updateEntry,
    linkDrawer,
    unlinkDrawer,
    linkTag,
    unlinkTag,
  };
}