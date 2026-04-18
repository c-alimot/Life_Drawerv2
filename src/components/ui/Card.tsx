import React from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";

type CardVariant = "soft" | "elevated";
type CardBorder = "none" | "subtle";
type CardPadding = "md" | "lg";

interface CardProps extends Omit<ViewProps, "style"> {
  variant?: CardVariant;
  border?: CardBorder;
  padding?: CardPadding;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  onPress?: PressableProps["onPress"];
  accessibilityLabel?: string;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 26,
    borderWidth: 0,
    shadowColor: "#2F2924",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  soft: {
    backgroundColor: "#F8F6F2",
  },
  elevated: {
    backgroundColor: "#F8F6F2",
  },
  borderNone: {
    borderWidth: 0,
  },
  borderSubtle: {
    borderWidth: 0,
  },
  paddingMd: {
    padding: 22,
  },
  paddingLg: {
    padding: 22,
  },
});

export function Card({
  variant = "soft",
  border = "none",
  padding = "lg",
  style,
  children,
  onPress,
  accessibilityLabel,
  ...props
}: CardProps) {
  const cardStyles = [
    styles.base,
    variant === "elevated" ? styles.elevated : styles.soft,
    border === "none" ? styles.borderNone : styles.borderSubtle,
    padding === "lg" ? styles.paddingLg : styles.paddingMd,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          cardStyles,
          pressed ? { transform: [{ scale: 0.97 }] } : null,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyles} accessibilityLabel={accessibilityLabel} {...props}>
      {children}
    </View>
  );
}

interface CardIconWrapProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function CardIconWrap({ children, style }: CardIconWrapProps) {
  return (
    <View
      style={[
        {
          width: 52,
          height: 52,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F1ECE4",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
