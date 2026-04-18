import { useTheme } from "@styles/theme";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface FilterPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function FilterPill({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: FilterPillProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.pill,
        {
          borderColor: selected ? "#8C9A7F" : "#DAC8B1",
          backgroundColor: selected ? "#ECE6DB" : "transparent",
        },
      ]}
      accessible
      accessibilityLabel={accessibilityLabel || label}
    >
      <Text
        style={[
          theme.typography.bodySm,
          {
            color: selected ? "#556950" : "#2F2924",
            fontWeight: "500",
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
});
