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
    primary: "#0a7ea4",
    secondary: "#6B7280",
    error: "#EF4444",
    warning: "#F59E0B",
    success: "#10B981",
    info: "#3B82F6",
    textSecondary: "#6B7280",
    textDisabled: "#D1D5DB",
    border: "#E5E7EB",
    divider: "#F3F4F6",
    gray: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
    },
  },
  dark: {
    ...Colors.dark,
    primary: "#60A5FA",
    secondary: "#9CA3AF",
    error: "#F87171",
    warning: "#FBBF24",
    success: "#34D399",
    info: "#60A5FA",
    textSecondary: "#D1D5DB",
    textDisabled: "#6B7280",
    border: "#4B5563",
    divider: "#374151",
    gray: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
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
    typography,
    spacing,
    useThemedColor: useThemeColor,
  };
};

export { Colors, Fonts } from "../../constants/theme";
export { useColorScheme, useThemeColor };

