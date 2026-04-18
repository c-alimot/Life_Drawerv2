import { ReactNode } from "react";
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";

export interface EntryMediaToolbarButton {
  key: string;
  content: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  disabled?: boolean;
  borderColor: string;
  backgroundColor?: string;
}

interface EntryMediaToolbarProps {
  buttons: EntryMediaToolbarButton[];
  containerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
}

export function EntryMediaToolbar({
  buttons,
  containerStyle,
  buttonStyle,
}: EntryMediaToolbarProps) {
  return (
    <View style={[styles.toolbar, containerStyle]}>
      {buttons.map((button) => (
        <TouchableOpacity
          key={button.key}
          style={[
            styles.toolbarButton,
            buttonStyle,
            {
              borderColor: button.borderColor,
              backgroundColor: button.backgroundColor || "#ECE6DB",
            },
          ]}
          onPress={button.onPress}
          disabled={button.disabled}
          accessible
          accessibilityLabel={button.accessibilityLabel}
          accessibilityHint={button.accessibilityHint}
          accessibilityRole="button"
        >
          {button.content}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
    marginTop: 12,
  },
  toolbarButton: {
    width: "22%",
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
});
