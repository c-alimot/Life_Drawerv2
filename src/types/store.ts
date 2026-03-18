import { Entry, Drawer, Tag, Profile, EntryDraft, MoodValue } from './entities';

/**
 * Global Zustand store state types
 */

// Auth Store State
export interface AuthStoreState {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

// Entry Draft Store State
export interface EntryDraftStoreState {
  draft: EntryDraft | null;
  isEditing: boolean;

  // Actions
  setDraft: (draft: EntryDraft) => void;
  updateDraft: (partial: Partial<EntryDraft>) => void;
  addDrawerToDraft: (drawerId: string) => void;
  removeDrawerFromDraft: (drawerId: string) => void;
  addTagToDraft: (tagId: string) => void;
  removeTagFromDraft: (tagId: string) => void;
  clearDraft: () => void;
  startEditing: (entryId: string) => void;
  stopEditing: () => void;
}

// Reflection Context Store State
export interface ReflectionContextStoreState {
  selectedDrawerIds: string[];
  selectedTagIds: string[];
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  moodFilter: MoodValue[];
  searchQuery: string;

  // Actions
  setSelectedDrawers: (drawerIds: string[]) => void;
  toggleDrawer: (drawerId: string) => void;
  setSelectedTags: (tagIds: string[]) => void;
  toggleTag: (tagId: string) => void;
  setDateRange: (startDate: string | null, endDate: string | null) => void;
  setMoodFilter: (moods: MoodValue[]) => void;
  toggleMood: (mood: MoodValue) => void;
  setSearchQuery: (query: string) => void;
  clearAllFilters: () => void;
}

// UI State Store
export interface UIStoreState {
  // Modal & Bottom sheet states
  modals: {
    createEntry: boolean;
    createDrawer: boolean;
    createTag: boolean;
    filters: boolean;
    entryOptions: boolean;
  };

  // Loading states
  isLoadingEntries: boolean;
  isLoadingDrawers: boolean;
  isLoadingTags: boolean;
  isSyncing: boolean;

  // Network state
  isOnline: boolean;
  syncError: string | null;

  // Active selections
  selectedEntryId: string | null;
  selectedDrawerId: string | null;

  // Actions
  openModal: (modalName: keyof UIStoreState['modals']) => void;
  closeModal: (modalName: keyof UIStoreState['modals']) => void;
  toggleModal: (modalName: keyof UIStoreState['modals']) => void;
  setLoadingEntries: (loading: boolean) => void;
  setLoadingDrawers: (loading: boolean) => void;
  setLoadingTags: (loading: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setOnlineStatus: (online: boolean) => void;
  setSyncError: (error: string | null) => void;
  setSelectedEntry: (entryId: string | null) => void;
  setSelectedDrawer: (drawerId: string | null) => void;
}

// Onboarding State
export interface OnboardingState {
  isOnboardingComplete: boolean;
  currentStep: number;
  setOnboardingComplete: (complete: boolean) => void;
  setCurrentStep: (step: number) => void;
}