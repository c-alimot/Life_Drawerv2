import { useTheme } from "@styles/theme";
import React, { useState } from "react";
import {
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

export interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  ...props
}: InputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyle = (): ViewStyle => {
    return {
      marginVertical: theme.spacing.xs,
    };
  };

  const getLabelStyle = (): TextStyle => {
    return {
      ...theme.typography.labelSm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      textTransform: "uppercase" as const,
    };
  };

  const getInputContainerStyle = (): ViewStyle => {
    let borderColor = theme.borders.subtle;
    if (error) {
      borderColor = theme.colors.error;
    } else if (isFocused) {
      borderColor = theme.borders.focus;
    }

    return {
      borderWidth: 1,
      borderColor,
      borderRadius: theme.radii.input,
      backgroundColor: disabled
        ? theme.colors.gray[100]
        : theme.surfaces.soft,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: multiline ? theme.spacing.md : theme.spacing.sm,
      minHeight: multiline ? 84 : 48,
    };
  };

  const getInputStyle = (): TextStyle => {
    return {
      ...theme.typography.body,
      color: disabled ? theme.colors.textDisabled : theme.colors.text,
      flex: 1,
      textAlignVertical: multiline ? "top" : "center",
      paddingVertical: 0, // Remove default padding to control height precisely
    };
  };

  const getErrorStyle = (): TextStyle => {
    return {
      ...theme.typography.bodySm,
      color: theme.colors.errorText,
      marginTop: theme.spacing.xs,
    };
  };

  return (
    <View style={[getContainerStyle(), style]}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}

      <View style={getInputContainerStyle()}>
        <TextInput
          style={[getInputStyle(), inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          accessible
          accessibilityLabel={label || placeholder}
          {...props}
        />
      </View>

      {error && <Text style={getErrorStyle()}>{error}</Text>}
    </View>
  );
}
