import { MoodValue, MoodData } from "@types";
export type { MoodValue, MoodData } from "@types";

export const MOOD_MAP: Record<MoodValue, MoodData> = {
  angry: {
    value: "angry",
    label: "Angry",
    emoji: "😡",
  },
  stressed: {
    value: "stressed",
    label: "Stressed",
    emoji: "🤯",
  },
  anxious: {
    value: "anxious",
    label: "Anxious",
    emoji: "😟",
  },
  sad: {
    value: "sad",
    label: "Sad",
    emoji: "😔",
  },
  tired: {
    value: "tired",
    label: "Tired",
    emoji: "😴",
  },
  bored: {
    value: "bored",
    label: "Bored",
    emoji: "🥱",
  },
  meh: {
    value: "meh",
    label: "Average / Meh",
    emoji: "😐",
  },
  calm: {
    value: "calm",
    label: "Calm",
    emoji: "🍃",
  },
  grateful: {
    value: "grateful",
    label: "Grateful",
    emoji: "🙏",
  },
  happy: {
    value: "happy",
    label: "Happy",
    emoji: "😊",
  },
  inspired: {
    value: "inspired",
    label: "Inspired",
    emoji: "✨",
  },
};

export const MOOD_VALUES: MoodValue[] = [
  "angry",
  "stressed",
  "anxious",
  "sad",
  "tired",
  "bored",
  "meh",
  "calm",
  "grateful",
  "happy",
  "inspired",
];

export const NUMERIC_MOOD_MAP: Record<number, MoodValue> = {
  0: "angry",
  1: "stressed",
  2: "anxious",
  3: "sad",
  4: "tired",
  5: "bored",
  6: "meh",
  7: "calm",
  8: "grateful",
  9: "happy",
  10: "inspired",
};

export const getMoodData = (mood: MoodValue): MoodData => {
  return MOOD_MAP[mood];
};