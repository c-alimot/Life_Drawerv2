import { useTheme } from "@styles/theme";
import React, { useEffect } from "react";
import {
    BackHandler,
    Platform,
    Modal as RNModal,
    StatusBar,
    StyleProp,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    ViewStyle,
} from "react-native";

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: "slide" | "fade" | "none";
  dismissOnBackdrop?: boolean;
  dismissOnBackButton?: boolean;
  transparent?: boolean;
  style?: StyleProp<ViewStyle>;
  backdropStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Modal({
  visible,
  onClose,
  children,
  animationType = "fade",
  dismissOnBackdrop = true,
  dismissOnBackButton = true,
  transparent = true,
  style,
  backdropStyle,
  contentStyle,
}: ModalProps) {
  const theme = useTheme();

  // Handle Android back button
  useEffect(() => {
    if (!visible || !dismissOnBackButton) return;

    const handleBackPress = () => {
      onClose();
      return true; // Prevent default behavior
    };

    if (Platform.OS === "android") {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackPress,
      );
      return () => subscription.remove();
    }
  }, [visible, onClose, dismissOnBackButton]);

  const getBackdropStyle = (): ViewStyle => {
    return {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.lg,
    };
  };

  const getContentStyle = (): ViewStyle => {
    return {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      padding: theme.spacing.xl,
      maxWidth: "100%",
      maxHeight: "90%",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16, // Android shadow
    };
  };

  const handleBackdropPress = () => {
    if (dismissOnBackdrop) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      animationType={animationType}
      transparent={transparent}
      onRequestClose={onClose}
      statusBarTranslucent
      style={style}
    >
      {/* Update status bar for modal */}
      <StatusBar
        backgroundColor="rgba(0, 0, 0, 0.5)"
        barStyle={
          theme.colorScheme === "dark" ? "light-content" : "dark-content"
        }
        translucent
      />

      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={[getBackdropStyle(), backdropStyle]}>
          <TouchableWithoutFeedback>
            <View style={[getContentStyle(), contentStyle]}>{children}</View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

// Helper components for common modal patterns
export interface ModalHeaderProps {
  title: string;
  onClose?: () => void;
  style?: ViewStyle;
}

export function ModalHeader({ title, onClose, style }: ModalHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: theme.spacing.lg,
        },
        style,
      ]}
    >
      <Text
        style={[theme.typography.h3, { color: theme.colors.text, flex: 1 }]}
      >
        {title}
      </Text>
      {onClose && (
        <TouchableOpacity
          onPress={onClose}
          style={{
            padding: theme.spacing.sm,
            marginRight: -theme.spacing.sm,
          }}
          accessibilityLabel="Close modal"
          accessibilityRole="button"
        >
          <Text style={{ fontSize: 24, color: theme.colors.textSecondary }}>
            ×
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export interface ModalFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ModalFooter({ children, style }: ModalFooterProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          marginTop: theme.spacing.lg,
          gap: theme.spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
