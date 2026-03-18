import { MoodValue, MoodData } from '@types';

export const MOOD_MAP: Record<MoodValue, MoodData> = {
  happy: {
    value: 'happy',
    label: 'Happy',
    emoji: '😊',
  },
  calm: {
    value: 'calm',
    label: 'Calm',
    emoji: '🍃',
  },
  inspired: {
    value: 'inspired',
    label: 'Inspired',
    emoji: '✨',
  },
  grateful: {
    value: 'grateful',
    label: 'Grateful',
    emoji: '🙏',
  },
  anxious: {
    value: 'anxious',
    label: 'Anxious',
    emoji: '😟',
  },
  stressed: {
    value: 'stressed',
    label: 'Stressed',
    emoji: '🤯',
  },
  angry: {
    value: 'angry',
    label: 'Angry',
    emoji: '😡',
  },
  sad: {
    value: 'sad',
    label: 'Sad',
    emoji: '😔',
  },
  tired: {
    value: 'tired',
    label: 'Tired',
    emoji: '😴',
  },
  bored: {
    value: 'bored',
    label: 'Bored',
    emoji: '🥱',
  },
  meh: {
    value: 'meh',
    label: 'Average / Meh',
    emoji: '😐',
  },
};

export const MOOD_VALUES: MoodValue[] = [
  'happy', 'calm', 'inspired', 'grateful', 'anxious', 
  'stressed', 'angry', 'sad', 'tired', 'bored', 'meh'
];

export const getMoodData = (mood: MoodValue): MoodData => {
  return MOOD_MAP[mood];
};