import { useTheme } from "@styles/theme";
import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacityProps,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

export interface ButtonProps
  extends Omit<TouchableOpacityProps, "style" | "onPress" | "children"> {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
  style,
  textStyle,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const theme = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.radii.pill,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
    };

    // Size variants
    const sizeStyles: Record<string, ViewStyle> = {
      sm: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        minHeight: 32,
      },
      md: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        minHeight: 48,
      },
      lg: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        minHeight: 56,
      },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: disabled
          ? theme.colors.gray[300]
          : theme.colors.primary,
      },
      secondary: {
        backgroundColor: disabled
          ? theme.colors.gray[200]
          : theme.colors.secondary,
      },
      outline: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: disabled ? theme.colors.gray[300] : theme.colors.border,
      },
      ghost: {
        backgroundColor: "transparent",
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = theme.typography.body;

    // Size-specific text styles
    const sizeStyles: Record<string, TextStyle> = {
      sm: { fontSize: 14, fontWeight: "600" },
      md: { fontSize: 16, fontWeight: "600" },
      lg: { fontSize: 18, fontWeight: "600" },
    };

    // Color based on variant and state
    let color = theme.colors.text;
    if (disabled) {
      color = theme.colors.textDisabled;
    } else if (variant === "primary") {
      color = theme.colors.surface;
    } else if (variant === "outline" || variant === "ghost") {
      color = variant === "ghost" ? theme.colors.secondary : theme.colors.secondary;
    } else if (variant === "secondary") {
      color = theme.colors.surface;
    }

    return {
      ...baseStyle,
      ...sizeStyles[size],
      color,
    };
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      accessible
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
      }}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={getTextStyle().color}
          style={{ marginRight: theme.spacing.sm }}
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}
