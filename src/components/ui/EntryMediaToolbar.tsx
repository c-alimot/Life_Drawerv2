import { ReactNode } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

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
}

export function EntryMediaToolbar({ buttons }: EntryMediaToolbarProps) {
  return (
    <View style={styles.toolbar}>
      {buttons.map((button) => (
        <TouchableOpacity
          key={button.key}
          style={[
            styles.toolbarButton,
            {
              borderColor: button.borderColor,
              backgroundColor: button.backgroundColor || "transparent",
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
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
