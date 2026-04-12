import { useDeferredValue, useMemo } from "react";
import type { SearchEntriesRequest } from "@types";
import type { MoodValue } from "@constants/moods";

export interface SearchFilters {
  mood: MoodValue | null
  drawer: string | null
  tag: string | null
  dateRange: "all" | "today" | "week" | "month"
}

const SEARCH_RESULTS_LIMIT = 1000;

export function useSearch(searchTerm: string, filters: SearchFilters) {
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const searchRequest = useMemo<SearchEntriesRequest>(() => {
    const trimmedQuery = deferredSearchTerm.trim();
    const request: SearchEntriesRequest = {
      limit: SEARCH_RESULTS_LIMIT,
      offset: 0,
    };

    if (trimmedQuery) {
      request.query = trimmedQuery;
    }

    if (filters.mood) {
      request.moodValues = [filters.mood];
    }

    if (filters.drawer) {
      request.drawerIds = [filters.drawer];
    }

    if (filters.tag) {
      request.tagIds = [filters.tag];
    }

    const { startDate, endDate } = getDateRange(filters.dateRange);
    if (startDate) {
      request.startDate = startDate;
    }
    if (endDate) {
      request.endDate = endDate;
    }

    return request;
  }, [deferredSearchTerm, filters]);

  return {
    searchRequest,
    appliedSearchTerm: deferredSearchTerm.trim(),
  };
}

function getDateRange(range: SearchFilters["dateRange"]) {
  if (range === "all") {
    return {};
  }

  const now = new Date();
  let start: Date;

  if (range === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === "week") {
    start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}
