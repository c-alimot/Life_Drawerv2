import { useMemo } from 'react';
import { useEntries } from '@features/entries/hooks/useEntries';
import type { Entry } from '@types';
import type { MoodValue } from '@constants/moods';

export interface SearchFilters {
  mood: MoodValue | null;
  drawer: string | null;
  tag: string | null;
  dateRange: 'all' | 'today' | 'week' | 'month';
}

export function useSearch(
  searchTerm: string,
  filters: SearchFilters
) {
  const { entries } = useEntries();

  const results = useMemo(() => {
    if (!entries) return [];

    return entries.filter((entry) => {
      // Search term filter
      const matchesSearchTerm =
        searchTerm === '' ||
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearchTerm) return false;

      // Mood filter
      if (filters.mood && entry.mood !== filters.mood) return false;

      // Drawer filter
      if (
        filters.drawer &&
        !entry.drawers?.some((d) => d.id === filters.drawer)
      ) {
        return false;
      }

      // Tag filter
      if (filters.tag && !entry.tags?.some((t) => t.id === filters.tag)) {
        return false;
      }

      // Date range filter
      const entryDate = new Date(entry.createdAt);
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay())
      );
      const startOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

      if (filters.dateRange === 'today' && entryDate < startOfDay) {
        return false;
      }
      if (filters.dateRange === 'week' && entryDate < startOfWeek) {
        return false;
      }
      if (filters.dateRange === 'month' && entryDate < startOfMonth) {
        return false;
      }

      return true;
    });
  }, [entries, searchTerm, filters]);

  return { results };
}