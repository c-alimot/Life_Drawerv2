import { MOOD_MAP, MOOD_VALUES, MoodValue } from "@constants/mood";
import { useTheme } from "@styles/theme";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EntryMoodPickerModalProps {
  visible: boolean;
  selectedMood: MoodValue | undefined;
  onSelectMood: (mood: MoodValue) => void;
  onClose: () => void;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  surfaceColor: string;
  primaryColor: string;
}

export function EntryMoodPickerModal({
  visible,
  selectedMood,
  onSelectMood,
  onClose,
  backgroundColor,
  textColor,
  borderColor,
  surfaceColor,
  primaryColor,
}: EntryMoodPickerModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        onPress={onClose}
        activeOpacity={1}
      >
        <View
          style={[
            styles.moodPicker,
            { backgroundColor },
          ]}
        >
          <Text
            style={[
              theme.typography.h3,
              { color: textColor, marginBottom: theme.spacing.md },
            ]}
          >
            How are you feeling?
          </Text>
          <View style={styles.moodGrid}>
            {MOOD_VALUES.map((moodValue) => {
              const moodData = MOOD_MAP[moodValue];
              const isSelected = selectedMood === moodValue;

              return (
                <TouchableOpacity
                  key={moodValue}
                  style={[
                    styles.moodOption,
                    {
                      backgroundColor: isSelected ? `${primaryColor}20` : surfaceColor,
                      borderColor: isSelected ? primaryColor : borderColor,
                    },
                  ]}
                  onPress={() => {
                    onSelectMood(moodValue);
                    onClose();
                  }}
                  accessible
                  accessibilityLabel={`Select mood: ${moodData.label}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.moodText}>{moodData.emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(47, 41, 36, 0.26)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  moodPicker: {
    borderRadius: 28,
    padding: 24,
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  moodOption: {
    width: "18%",
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  moodText: {
    fontSize: 28,
  },
});
