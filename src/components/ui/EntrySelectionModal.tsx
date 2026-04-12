import { SafeArea, Screen } from "@components/layout";
import { useTheme } from "@styles/theme";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal } from "react-native";
import { Button } from "./Button";

interface EntrySelectionItem {
  id: string;
  name: string;
}

interface EntrySelectionModalProps {
  visible: boolean;
  title: string;
  items: EntrySelectionItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
  createValue: string;
  onCreateValueChange: (value: string) => void;
  onCreate: () => void;
  createPlaceholder: string;
  createAccessibilityLabel: string;
  createButtonAccessibilityLabel: string;
  placeholderTextColor: string;
  textColor: string;
  backgroundColor: string;
  surfaceColor: string;
  borderColor: string;
  primaryColor: string;
  inverseTextColor: string;
}

export function EntrySelectionModal({
  visible,
  title,
  items,
  selectedIds,
  onToggle,
  onClose,
  createValue,
  onCreateValueChange,
  onCreate,
  createPlaceholder,
  createAccessibilityLabel,
  createButtonAccessibilityLabel,
  placeholderTextColor,
  textColor,
  backgroundColor,
  surfaceColor,
  borderColor,
  primaryColor,
  inverseTextColor,
}: EntrySelectionModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeArea>
        <Screen
          style={[
            styles.modalContainer,
            { backgroundColor },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text
              style={[theme.typography.h2, { color: textColor }]}
            >
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessible
              accessibilityLabel="Close"
            >
              <Text
                style={[theme.typography.h3, { color: textColor }]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContent}
          >
            <View style={{ marginBottom: theme.spacing.lg }}>
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor,
                      color: textColor,
                      backgroundColor: surfaceColor,
                      flex: 1,
                    },
                  ]}
                  placeholder={createPlaceholder}
                  placeholderTextColor={placeholderTextColor}
                  value={createValue}
                  onChangeText={onCreateValueChange}
                  accessibilityLabel={createAccessibilityLabel}
                />
                <Button
                  label="Add"
                  onPress={onCreate}
                  size="sm"
                  disabled={!createValue.trim()}
                  accessibilityLabel={createButtonAccessibilityLabel}
                />
              </View>
            </View>

            {items.map((item) => {
              const selected = selectedIds.includes(item.id);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.modalItem,
                    {
                      borderColor: selected ? primaryColor : borderColor,
                      backgroundColor: selected ? `${primaryColor}10` : surfaceColor,
                    },
                  ]}
                  onPress={() => onToggle(item.id)}
                  accessible
                  accessibilityLabel={item.name}
                  accessibilityHint={selected ? "Selected" : "Not selected"}
                  accessibilityRole="checkbox"
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: selected ? primaryColor : "transparent",
                        borderColor: selected ? primaryColor : borderColor,
                      },
                    ]}
                  >
                    {selected ? (
                      <Text style={{ color: inverseTextColor }}>✓</Text>
                    ) : null}
                  </View>

                  <Text
                    style={[
                      theme.typography.body,
                      { color: textColor },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Screen>
      </SafeArea>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
});
