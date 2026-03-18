import {
  Entry,
  EntryWithRelations,
  Drawer,
  Tag,
  Profile,
  EntryDraft,
} from './entities';

/**
 * API Response wrapper types
 * Used for API calls and responses
 */

// Generic API response
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

// API error structure
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Auth Requests
export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupResponse {
  user: Profile;
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface LoginResponse {
  user: Profile;
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

// Entry Requests/Responses
export interface CreateEntryRequest {
  title: string;
  content: string;
  mood?: string;
  drawerIds?: string[];
  tagIds?: string[];
}

export interface UpdateEntryRequest {
  title?: string;
  content?: string;
  mood?: string;
}

export interface CreateEntryResponse {
  entry: EntryWithRelations;
}

export interface UpdateEntryResponse {
  entry: EntryWithRelations;
}

export interface GetEntriesResponse {
  entries: EntryWithRelations[];
  total: number;
  hasMore: boolean;
}

export interface GetEntryResponse {
  entry: EntryWithRelations;
}

// Drawer Requests/Responses
export interface CreateDrawerRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateDrawerRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface GetDrawersResponse {
  drawers: DrawerWithRelations[];
  total: number;
}

export interface GetDrawerResponse {
  drawer: DrawerWithRelations;
}

// Tag Requests/Responses
export interface CreateTagRequest {
  name: string;
}

export interface GetTagsResponse {
  tags: Tag[];
  total: number;
}

// Link/Unlink Requests
export interface LinkEntryToDrawerRequest {
  entryId: string;
  drawerId: string;
}

export interface LinkEntryToTagRequest {
  entryId: string;
  tagId: string;
}

export interface UnlinkEntryFromDrawerRequest {
  entryId: string;
  drawerId: string;
}

export interface UnlinkEntryFromTagRequest {
  entryId: string;
  tagId: string;
}

// Search/Filter Requests
export interface SearchEntriesRequest {
  query?: string;
  drawerIds?: string[];
  tagIds?: string[];
  moodValues?: string[];
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  limit?: number;
  offset?: number;
}

export interface SearchEntriesResponse {
  entries: EntryWithRelations[];
  total: number;
  hasMore: boolean;
}

// Pagination helper
export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}