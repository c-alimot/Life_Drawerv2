import { useState, useCallback } from 'react';
import { useAuthStore } from '@store';
import { entriesApi } from '../api/entries.api';
import type { ApiError, MoodValue } from '@types';

export function useCreateEntryWithMedia() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createEntry = useCallback(
    async (data: {
      title: string;
      content: string;
      mood?: MoodValue;
      drawerIds?: string[];
      tagIds?: string[];
      imageUris?: string[];
      audioUri?: string;
      location?: { latitude: number; longitude: number; address?: string };
    }) => {
      if (!user) return null;

      setIsLoading(true);
      setError(null);
      setUploadProgress(0);

      try {
        const result = await entriesApi.createEntry(user.id, {
          title: data.title,
          content: data.content,
          mood: data.mood,
          drawerIds: data.drawerIds,
          tagIds: data.tagIds,
          imageUris: data.imageUris,
          audioUri: data.audioUri,
          location: data.location,
        });

        if (!result.success || !result.data) {
          setError(
            result.error || {
              code: 'UNKNOWN_ERROR',
              message: 'Failed to create entry',
            }
          );
          return null;
        }

        setUploadProgress(100);
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
    uploadProgress,
  };
}
