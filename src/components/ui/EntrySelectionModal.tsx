import { SafeArea, Screen } from "@components/layout";
import { MaterialCommunityIcons } from "@components/ui/icons";
import { useTheme } from "@styles/theme";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal as RNModal,
} from "react-native";
import { Button } from "./Button";
import { Modal } from "./Modal";

const ENTRY_SELECT_INPUT_BG = "#F8F6F2";
const ENTRY_SELECT_BORDER = "#DAC8B1";
const ENTRY_SELECT_SELECTED_BORDER = "#556950";
const ENTRY_SELECT_SELECTED_BG = "#E6E2D8";

interface EntrySelectionItem {
  id: string;
  name: string;
  isManageable?: boolean;
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
  itemTypeLabel?: string;
  onEditItem?: (itemId: string, name: string) => Promise<boolean>;
  onDeleteItem?: (itemId: string) => Promise<boolean>;
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
  itemTypeLabel = "item",
  onEditItem,
  onDeleteItem,
}: EntrySelectionModalProps) {
  const theme = useTheme();
  const trimmedCreateValue = createValue.trim();
  const showCreateButton = trimmedCreateValue.length > 0;
  const [menuTarget, setMenuTarget] = useState<EntrySelectionItem | null>(null);
  const [editingItem, setEditingItem] = useState<EntrySelectionItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EntrySelectionItem | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const canManageItems = Boolean(onEditItem && onDeleteItem);

  useEffect(() => {
    if (!visible) {
      setMenuTarget(null);
      setEditingItem(null);
      setDeleteTarget(null);
      setEditValue("");
      setIsSavingItem(false);
      setIsDeletingItem(false);
    }
  }, [visible]);

  const openEditModal = () => {
    if (!menuTarget || !onEditItem) {
      return;
    }

    setEditingItem(menuTarget);
    setEditValue(menuTarget.name);
    setMenuTarget(null);
  };

  const openDeleteModal = () => {
    if (!menuTarget || !onDeleteItem) {
      return;
    }

    setDeleteTarget(menuTarget);
    setMenuTarget(null);
  };

  const handleSaveItem = async () => {
    if (!editingItem || !onEditItem) {
      return;
    }

    const trimmedName = editValue.trim();
    if (!trimmedName) {
      return;
    }

    setIsSavingItem(true);
    const success = await onEditItem(editingItem.id, trimmedName);
    setIsSavingItem(false);

    if (success) {
      setEditingItem(null);
      setEditValue("");
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteTarget || !onDeleteItem) {
      return;
    }

    setIsDeletingItem(true);
    const success = await onDeleteItem(deleteTarget.id);
    setIsDeletingItem(false);

    if (success) {
      setDeleteTarget(null);
    }
  };

  return (
    <RNModal
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
              style={[
                theme.typography.h2,
                styles.modalTitle,
                { color: textColor },
              ]}
            >
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessible
              accessibilityLabel="Save"
            >
              <Text
                style={[
                  theme.typography.body,
                  styles.saveText,
                  { color: textColor },
                ]}
              >
                Save
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
                      borderColor: ENTRY_SELECT_BORDER,
                      color: textColor,
                      backgroundColor: ENTRY_SELECT_INPUT_BG,
                      flex: 1,
                    },
                  ]}
                  placeholder={createPlaceholder}
                  placeholderTextColor={placeholderTextColor}
                  value={createValue}
                  onChangeText={onCreateValueChange}
                  accessibilityLabel={createAccessibilityLabel}
                />
                {showCreateButton ? (
                  <Button
                    label="Add"
                    onPress={onCreate}
                    size="sm"
                    accessibilityLabel={createButtonAccessibilityLabel}
                  />
                ) : null}
              </View>
            </View>

            {items.map((item) => {
              const selected = selectedIds.includes(item.id);
              const isManageable = canManageItems && item.isManageable !== false;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.modalItem,
                    {
                      borderColor: selected
                        ? ENTRY_SELECT_SELECTED_BORDER
                        : ENTRY_SELECT_BORDER,
                      backgroundColor: selected
                        ? ENTRY_SELECT_SELECTED_BG
                        : ENTRY_SELECT_INPUT_BG,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.itemMainButton}
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
                          backgroundColor: selected
                            ? ENTRY_SELECT_SELECTED_BORDER
                            : "transparent",
                          borderColor: selected
                            ? ENTRY_SELECT_SELECTED_BORDER
                            : ENTRY_SELECT_BORDER,
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
                        styles.itemText,
                        { color: textColor },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>

                  {isManageable ? (
                    <TouchableOpacity
                      onPress={() => setMenuTarget(item)}
                      style={styles.itemMenuButton}
                      accessible
                      accessibilityLabel={`More options for ${item.name}`}
                      accessibilityRole="button"
                    >
                      <MaterialCommunityIcons
                        name="dots-horizontal"
                        size={22}
                        color={textColor}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        </Screen>
      </SafeArea>
      <Modal
        visible={!!menuTarget}
        onClose={() => setMenuTarget(null)}
        animationType="fade"
        backdropStyle={styles.menuBackdrop}
        contentStyle={[styles.menuModal, { backgroundColor: surfaceColor }]}
      >
        <Text
          style={[
            styles.menuTitle,
            { color: textColor, fontFamily: theme.fonts.serif },
          ]}
        >
          {menuTarget?.name || itemTypeLabel}
        </Text>
        <Text style={[theme.typography.body, styles.menuSubtitle, { color: placeholderTextColor }]}>
          Choose what you want to do with this {itemTypeLabel}.
        </Text>
        <Button
          label="Edit"
          onPress={openEditModal}
          variant="primary"
          style={[styles.menuActionButton, styles.menuEditButton]}
          textStyle={{ color: primaryColor, fontWeight: "700" }}
        />
        <Button
          label="Delete"
          onPress={openDeleteModal}
          variant="primary"
          style={[styles.menuActionButton, styles.menuDeleteButton]}
          textStyle={{ color: "#FFFFFF", fontWeight: "700" }}
        />
        <Button
          label="Cancel"
          onPress={() => setMenuTarget(null)}
          variant="primary"
          style={[styles.menuActionButton, styles.menuCancelButton]}
          textStyle={{ color: "#5F6368", fontWeight: "700" }}
        />
      </Modal>

      <Modal
        visible={!!editingItem}
        onClose={() => setEditingItem(null)}
        backdropStyle={styles.menuBackdrop}
        contentStyle={[styles.editorModal, { backgroundColor: surfaceColor }]}
      >
        <Text
          style={[
            styles.menuTitle,
            { color: textColor, fontFamily: theme.fonts.serif },
          ]}
        >
          Edit {itemTypeLabel === "tag" ? "Tag" : "Drawer"}
        </Text>
        <Text style={[theme.typography.body, styles.menuSubtitle, { color: placeholderTextColor }]}>
          Update the name for this {itemTypeLabel}.
        </Text>
        <TextInput
          value={editValue}
          onChangeText={setEditValue}
          placeholder={`Enter ${itemTypeLabel} name`}
          placeholderTextColor={placeholderTextColor}
          style={[
            styles.editorInput,
            {
              color: textColor,
              borderColor: ENTRY_SELECT_BORDER,
              backgroundColor: ENTRY_SELECT_INPUT_BG,
            },
          ]}
          accessibilityLabel={`Edit ${itemTypeLabel} name`}
        />
        <View style={styles.editorActions}>
          <Button
            label="Cancel"
            onPress={() => setEditingItem(null)}
            variant="primary"
            style={[styles.confirmButton, styles.menuCancelButton]}
            textStyle={{ color: "#5F6368", fontWeight: "700" }}
          />
          <Button
            label="Save"
            onPress={handleSaveItem}
            loading={isSavingItem}
            disabled={!editValue.trim()}
            variant="primary"
            style={[styles.confirmButton, { backgroundColor: primaryColor, borderColor: primaryColor }]}
            textStyle={{ color: "#FFFFFF", fontWeight: "700" }}
          />
        </View>
      </Modal>

      <Modal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        animationType="fade"
        backdropStyle={styles.menuBackdrop}
        contentStyle={[styles.menuModal, { backgroundColor: surfaceColor }]}
      >
        <Text
          style={[
            styles.menuTitle,
            { color: textColor, fontFamily: theme.fonts.serif },
          ]}
        >
          Delete {itemTypeLabel === "tag" ? "Tag" : "Drawer"}
        </Text>
        <Text style={[theme.typography.body, styles.menuSubtitle, { color: placeholderTextColor }]}>
          Are you sure you want to delete this {itemTypeLabel}?
        </Text>
        <View style={styles.editorActions}>
          <Button
            label="Cancel"
            onPress={() => setDeleteTarget(null)}
            variant="primary"
            style={[styles.confirmButton, styles.menuCancelButton]}
            textStyle={{ color: "#5F6368", fontWeight: "700" }}
          />
          <Button
            label="Delete"
            onPress={handleDeleteItem}
            loading={isDeletingItem}
            variant="primary"
            style={[styles.confirmButton, styles.menuDeleteButton]}
            textStyle={{ color: "#FFFFFF", fontWeight: "700" }}
          />
        </View>
      </Modal>
    </RNModal>
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
    paddingTop: 32,
    paddingBottom: 16,
  },
  modalTitle: {
    fontWeight: "400",
  },
  saveText: {
    fontWeight: "400",
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
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  itemMainButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemMenuButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  itemText: {
    fontWeight: "400",
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  menuBackdrop: {
    paddingHorizontal: 24,
    backgroundColor: "rgba(47, 41, 36, 0.28)",
  },
  menuModal: {
    width: "100%",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  editorModal: {
    width: "100%",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  menuTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "400",
    marginBottom: 6,
  },
  menuSubtitle: {
    marginBottom: 14,
    lineHeight: 22,
  },
  menuActionButton: {
    minHeight: 52,
    borderRadius: 999,
    marginBottom: 10,
  },
  menuEditButton: {
    backgroundColor: "#DFE8D9",
    borderColor: "#C9D8C0",
  },
  menuDeleteButton: {
    backgroundColor: "#A6544E",
    borderColor: "#A6544E",
  },
  menuCancelButton: {
    backgroundColor: "#E3E1DC",
    borderColor: "#C9C4BB",
  },
  editorInput: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  editorActions: {
    flexDirection: "row",
    gap: 10,
  },
  confirmButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
  },
});
