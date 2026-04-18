import { useTheme } from "@styles/theme";
import React from "react";
import {
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

export interface ChipProps {
  label: string;
  color?: string;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  variant?: "default" | "filter" | "tag" | "mood";
  size?: "sm" | "md";
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Chip({
  label,
  color,
  onPress,
  selected = false,
  disabled = false,
  variant = "default",
  size = "md",
  icon,
  style,
}: ChipProps) {
  const theme = useTheme();

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.radii.chip,
      borderWidth: 1,
    };

    // Size variants
    const sizeStyles: Record<string, ViewStyle> = {
      sm: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        minHeight: 28,
      },
      md: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        minHeight: 34,
      },
    };

    // Color and selection logic
    let backgroundColor = theme.colors.surface || theme.colors.background;
    let borderColor = theme.colors.border;

    if (disabled) {
      backgroundColor = theme.colors.gray[100];
      borderColor = theme.colors.gray[200];
    } else if (selected) {
      if (color) {
        backgroundColor = color + "30"; // Add transparency
        borderColor = color;
      } else {
        backgroundColor = theme.colors.primary + "20";
        borderColor = theme.colors.primary;
      }
    } else if (variant === "tag" && color) {
      backgroundColor = color + "20";
      borderColor = color;
    } else if (variant === "filter") {
      backgroundColor = theme.colors.surface || theme.colors.background;
      borderColor = theme.colors.border;
    }

    return {
      ...baseStyle,
      ...sizeStyles[size],
      backgroundColor,
      borderColor,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle =
      size === "sm" ? theme.typography.labelXs : theme.typography.bodySm;

    let textColor = theme.colors.text;

    if (disabled) {
      textColor = theme.colors.textDisabled;
    } else if (selected) {
      if (color) {
        textColor = color;
      } else {
        textColor = theme.colors.primary;
      }
    } else if (variant === "tag" && color) {
      textColor = color;
    }

    return {
      ...baseStyle,
      color: textColor,
      fontWeight: selected ? "600" : "500",
    };
  };

  const ChipContent = () => (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {icon && <View style={{ marginRight: theme.spacing.xs }}>{icon}</View>}
      <Text style={getTextStyle()} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        style={[getContainerStyle(), style]}
        onPress={onPress}
        accessible
        accessibilityLabel={`${variant} chip: ${label}`}
        accessibilityRole="button"
        accessibilityState={{
          selected,
          disabled,
        }}
      >
        <ChipContent />
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[getContainerStyle(), style]}
      accessible
      accessibilityLabel={`${variant} chip: ${label}`}
    >
      <ChipContent />
    </View>
  );
}
