// ==================== AUTH TYPES ====================

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// ==================== ENTRY TYPES ====================

export interface Entry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  images?: string[];
  audioUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface EntryWithRelations extends Entry {
  drawers?: Drawer[];
  tags?: Tag[];
  author?: Profile;
}

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

export interface SearchEntriesRequest {
  query?: string;
  moodValues?: string[];
  drawerIds?: string[];
  tagIds?: string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ==================== DRAWER TYPES ====================

export interface Drawer {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DrawerWithRelations extends Drawer {
  entries?: Entry[];
  entryCount?: number;
  owner?: Profile;
}

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

// ==================== TAG TYPES ====================

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

// ==================== PROFILE TYPES ====================

export interface Profile {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== MOOD TYPES ====================

export type MoodValue =
  | 'happy'
  | 'calm'
  | 'inspired'
  | 'grateful'
  | 'anxious'
  | 'stressed'
  | 'angry'
  | 'sad'
  | 'tired'
  | 'bored'
  | 'meh';

export interface MoodData {
  value: MoodValue;
  label: string;
  emoji: string;
}

// ==================== ERROR TYPES ====================

export interface ApiError {
  code: string;
  message: string;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}