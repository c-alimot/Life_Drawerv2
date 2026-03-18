// Entity types
export * from './entities';

// API types
export * from './api';

// Store types
export * from './store';

// UI component types
export * from './ui';

/**
 * Mood related types for Life Drawer
 */
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

// Type guards
export const isMoodValue = (value: any): value is MoodValue => {
  const validMoods: MoodValue[] = [
    'happy', 'calm', 'inspired', 'grateful', 'anxious', 
    'stressed', 'angry', 'sad', 'tired', 'bored', 'meh'
  ];
  return validMoods.includes(value);
};

export const isEntry = (value: any): value is Entry => {
  return (
    value &&
    typeof value === 'object' &&
    'id' in value &&
    'userId' in value &&
    'title' in value &&
    'content' in value
  );
};

export const isDrawer = (value: any): value is Drawer => {
  return (
    value &&
    typeof value === 'object' &&
    'id' in value &&
    'userId' in value &&
    'name' in value
  );
};

export const isTag = (value: any): value is Tag => {
  return (
    value &&
    typeof value === 'object' &&
    'id' in value &&
    'userId' in value &&
    'name' in value
  );
};

export const isProfile = (value: any): value is Profile => {
  return (
    value &&
    typeof value === 'object' &&
    'id' in value &&
    'email' in value
  );
};