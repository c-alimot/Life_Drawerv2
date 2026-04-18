import { useTheme } from "@styles/theme";
import { StyleSheet, Text, View } from "react-native";

interface SectionHeaderProps {
  label: string;
  textColor: string;
  dividerColor: string;
}

export function SectionHeader({ label, textColor, dividerColor }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Text
        style={[
          theme.typography.caption,
          styles.text,
          { color: textColor },
        ]}
      >
        {label}
      </Text>
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  text: {
    textTransform: "uppercase",
    letterSpacing: 1.8,
  },
  divider: {
    flex: 1,
    height: 1,
    opacity: 0.85,
  },
});
