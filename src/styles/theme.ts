/**
 * Theme configuration and hooks
 * Re-exports theme colors and utilities
 */

import { Colors, Fonts } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { useThemeColor } from "../../hooks/use-theme-color";

const typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  bodySm: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "600" as const,
    lineHeight: 16,
  },
  labelSm: {
    fontSize: 11,
    fontWeight: "600" as const,
    lineHeight: 14,
  },
  labelXs: {
    fontSize: 10,
    fontWeight: "600" as const,
    lineHeight: 12,
  },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Extended color palette
const extendedColors = {
  light: {
    ...Colors.light,
    primary: "#8C9A7F",
    secondary: "#556950",
    accent1: "#DAC8B1",
    accent2: "#B39C87",
    surface: "#F8F6F2",
    error: "#A6544E",
    errorText: "#8B2D2A",
    errorBackground: "#F2D9D7",
    warning: "#B07A3A",
    warningBackground: "#F1E2CF",
    success: "#4F7A63",
    successBackground: "#DCE9E1",
    info: "#8C9A7F",
    textSecondary: "#6F6860",
    textMuted: "#8A8178",
    textDisabled: "#B8AEA4",
    border: "#B39C87",
    divider: "#DAC8B1",
    gray: {
      50: "#F8F6F2",
      100: "#F2EEE7",
      200: "#E7DED2",
      300: "#DAC8B1",
      400: "#B39C87",
      500: "#8A8178",
      600: "#6F6860",
      700: "#556950",
      800: "#3E372F",
      900: "#2F2924",
    },
  },
  dark: {
    ...Colors.dark,
    primary: "#8C9A7F",
    secondary: "#DAC8B1",
    accent1: "#556950",
    accent2: "#B39C87",
    surface: "#3A342E",
    error: "#F2D9D7",
    errorText: "#8B2D2A",
    errorBackground: "#6A3A37",
    warning: "#F1E2CF",
    warningBackground: "#6D5333",
    success: "#DCE9E1",
    successBackground: "#355241",
    info: "#DAC8B1",
    textSecondary: "#DAC8B1",
    textMuted: "#B39C87",
    textDisabled: "#8A8178",
    border: "#6F6860",
    divider: "#556950",
    gray: {
      50: "#F8F6F2",
      100: "#DAC8B1",
      200: "#B39C87",
      300: "#8A8178",
      400: "#6F6860",
      500: "#556950",
      600: "#4A443D",
      700: "#3A342E",
      800: "#2F2924",
      900: "#231F1B",
    },
  },
};

export const theme = {
  colors: Colors,
  extendedColors,
  fonts: Fonts,
  typography,
  spacing,
};

export const useTheme = () => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = {
    ...extendedColors[colorScheme],
    // Keep legacy color names for backwards compatibility
    ...Colors[colorScheme],
  };

  return {
    colors,
    colorScheme,
    fonts: Fonts,
    typography,
    spacing,
    useThemedColor: useThemeColor,
  };
};

export { Colors, Fonts } from "../../constants/theme";
export { useColorScheme, useThemeColor };
