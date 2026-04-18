import { StyleSheet, ViewStyle } from "react-native";
import { Modal } from "./Modal";

interface AppModalSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: "slide" | "fade" | "none";
  contentStyle?: ViewStyle;
  backdropStyle?: ViewStyle;
}

export function AppModalSheet({
  visible,
  onClose,
  children,
  animationType = "fade",
  contentStyle,
  backdropStyle,
}: AppModalSheetProps) {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      animationType={animationType}
      backdropStyle={[styles.backdrop, backdropStyle]}
      contentStyle={[styles.content, contentStyle]}
    >
      {children}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    paddingHorizontal: 24,
    backgroundColor: "rgba(47, 41, 36, 0.28)",
  },
  content: {
    width: "100%",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    maxHeight: "78%",
  },
});
