/**
 * Database schema types
 * Represents the shape of data from Supabase
 */

// User & Profile
export interface Profile {
  id: string; // UUID from auth.users
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// Mood tracking
export type MoodValue = 'terrible' | 'bad' | 'neutral' | 'good' | 'great';

export interface MoodData {
  value: MoodValue;
  label: string;
  emoji: string;
}

// Entries (the main content)
export interface Entry {
  id: string; // UUID
  userId: string; // FK to profiles.id
  title: string;
  content: string;
  mood?: MoodValue;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  deletedAt: string | null; // Soft delete support
}

// Drawers (collection/organization)
export interface Drawer {
  id: string; // UUID
  userId: string; // FK to profiles.id
  name: string;
  description: string | null;
  color: string; // Hex color code
  icon: string | null; // Icon name or emoji
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// Tags (flexible labels)
export interface Tag {
  id: string; // UUID
  userId: string; // FK to profiles.id
  name: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// Junction Tables (Many-to-Many relationships)

/**
 * Associates entries with drawers
 * An entry can belong to multiple drawers
 * A drawer can contain multiple entries
 */
export interface EntryDrawer {
  id: string; // UUID
  entryId: string; // FK to entries.id
  drawerId: string; // FK to drawers.id
  createdAt: string; // ISO timestamp
}

/**
 * Associates entries with tags
 * An entry can have multiple tags
 * A tag can label multiple entries
 */
export interface EntryTag {
  id: string; // UUID
  entryId: string; // FK to entries.id
  tagId: string; // FK to tags.id
  createdAt: string; // ISO timestamp
}

// Session & Auth
export interface AppSession {
  user: Profile;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  expiresIn: number; // Seconds
}

// Draft/Form state
export interface EntryDraft {
  id?: string; // If editing
  title: string;
  content: string;
  mood?: MoodValue;
  selectedDrawerIds: string[];
  selectedTagIds: string[];
  attachments?: string[]; // File URLs or paths
}

// Enriched/Populated Types (with relations)

/**
 * Entry with populated relations
 * Used after fetching from Supabase with joins
 */
export interface EntryWithRelations extends Entry {
  drawers: Drawer[];
  tags: Tag[];
  author: Profile;
}

/**
 * Drawer with populated relations
 */
export interface DrawerWithRelations extends Drawer {
  entries: Entry[];
  entryCount: number;
  owner: Profile;
}

/**
 * Tag with metadata
 */
export interface TagWithMetadata extends Tag {
  entryCount: number;
}