import { ViewStyle, TextStyle } from 'react-native';
import { Entry, Drawer, Tag, EntryWithRelations } from './entities';

/**
 * UI Component prop types
 */

// Button variants
export type ButtonVariant = 'primary' | 'secondary' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Input variants
export type InputVariant = 'default' | 'error' | 'success';

// Card variants
export type CardVariant = 'elevated' | 'outlined' | 'filled';

// Entry Card Props
export interface EntryCardProps {
  entry: EntryWithRelations;
  onPress?: (entryId: string) => void;
  onLongPress?: (entryId: string) => void;
  isSelected?: boolean;
  showDrawers?: boolean;
  showTags?: boolean;
}

// Drawer Card Props
export interface DrawerCardProps {
  drawer: Drawer;
  onPress?: (drawerId: string) => void;
  onLongPress?: (drawerId: string) => void;
  entryCount?: number;
  isSelected?: boolean;
}

// Tag Chip Props
export interface TagChipProps {
  tag: Tag;
  onPress?: (tagId: string) => void;
  selected?: boolean;
  removable?: boolean;
  onRemove?: (tagId: string) => void;
}

// Tag Picker Props
export interface TagPickerProps {
  tags: Tag[];
  selectedTagIds: string[];
  onSelectionChange: (tagIds: string[]) => void;
  maxSelections?: number;
}

// Drawer Picker Props
export interface DrawerPickerProps {
  drawers: Drawer[];
  selectedDrawerIds: string[];
  onSelectionChange: (drawerIds: string[]) => void;
  maxSelections?: number;
}

// Mood Selector Props
export interface MoodSelectorProps {
  selected?: string;
  onSelect: (mood: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

// Entry Editor Props
export interface EntryEditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  mood?: string;
  onMoodChange?: (mood: string) => void;
}

// Filter Bar Props
export interface FilterBarProps {
  selectedDrawerIds: string[];
  selectedTagIds: string[];
  onDrawerChange: (drawerIds: string[]) => void;
  onTagChange: (tagIds: string[]) => void;
  drawerOptions: Drawer[];
  tagOptions: Tag[];
}

// List/Grid Props
export interface ListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface GridProps<T> extends ListProps<T> {
  columns?: number;
  spacing?: number;
}