export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type MoodValue =
  | "happy"
  | "calm"
  | "inspired"
  | "grateful"
  | "anxious"
  | "stressed"
  | "angry"
  | "sad"
  | "tired"
  | "bored"
  | "meh";

export interface MoodData {
  value: MoodValue;
  label: string;
  emoji: string;
}

export interface Profile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntryLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Entry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: MoodValue;
  images: string[];
  audioUrl?: string;
  location?: EntryLocation;
  occurredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntryWithRelations extends Entry {
  drawers: Drawer[];
  tags: Tag[];
  author?: Profile;
}

export interface DrawerWithRelations extends Drawer {
  entries: Entry[];
  entryCount: number;
  owner?: Profile;
}

export interface TagWithMetadata extends Tag {
  entryCount: number;
}

export interface EntryDraft {
  id?: string;
  title: string;
  content: string;
  mood?: MoodValue;
  selectedDrawerIds: string[];
  selectedTagIds: string[];
  imageUris?: string[];
  audioUri?: string;
  location?: EntryLocation;
}

export interface CreateEntryRequest {
  title: string;
  content: string;
  mood?: MoodValue;
  drawerIds?: string[];
  tagIds?: string[];
  imageUris?: string[];
  audioUri?: string;
  location?: EntryLocation;
  occurredAt?: string;
}

export interface UpdateEntryRequest {
  title?: string;
  content?: string;
  mood?: MoodValue;
  imageUris?: string[];
  audioUrl?: string | null;
  location?: EntryLocation | null;
  drawerIds?: string[];
  tagIds?: string[];
  occurredAt?: string | null;
}

export interface SearchEntriesRequest {
  query?: string;
  moodValues?: MoodValue[];
  drawerIds?: string[];
  tagIds?: string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
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

export interface CreateTagRequest {
  name: string;
  color?: string;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
}

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
