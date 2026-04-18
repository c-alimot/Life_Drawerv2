/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#8C9A7F';
const tintColorDark = '#F8F6F2';

export const Colors = {
  light: {
    text: '#2F2924',
    background: '#EDEAE4',
    tint: tintColorLight,
    icon: '#6F6860',
    tabIconDefault: '#8A8178',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F8F6F2',
    background: '#2F2924',
    tint: tintColorDark,
    icon: '#DAC8B1',
    tabIconDefault: '#B39C87',
    tabIconSelected: tintColorDark,
  },
};

export const SurfaceTokens = {
  background: "#EDEAE4",
  soft: "#F8F6F2",
  card: "#F8F6F2",
  elevated: "#FFFFFF",
  modal: "#FFFFFF",
} as const;

export const BorderTokens = {
  subtle: "#E7DED2",
  default: "#DAC8B1",
  strong: "#B39C87",
  focus: "#8C9A7F",
  divider: "#DAC8B1",
} as const;

export const RadiusTokens = {
  input: 16,
  card: 26,
  sheet: 24,
  chip: 999,
  pill: 999,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'Roboto_500Medium',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'Roboto_500Medium',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui",
    serif: "Roboto_500Medium",
    rounded: "sans-serif",
    mono: "monospace",
  },
});
