import { MaterialCommunityIcons } from "@components/ui/icons";
import { useTheme } from "@styles/theme";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { Card } from "./Card";

interface EmptyStateCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
  accessibilityActionLabel?: string;
}

export function EmptyStateCard({
  icon,
  title,
  description,
  actionLabel,
  onActionPress,
  accessibilityActionLabel,
}: EmptyStateCardProps) {
  const theme = useTheme();

  return (
    <Card style={styles.card} variant="elevated" border="subtle">
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={32} color="#8C9A7F" />
      </View>
      <Text style={[theme.typography.h2, styles.title, { color: "#2F2924", fontFamily: theme.fonts.serif }]}>
        {title}
      </Text>
      <Text style={[theme.typography.body, styles.body, { color: "#6F6860" }]}>
        {description}
      </Text>
      {actionLabel && onActionPress ? (
        <Button
          label={actionLabel}
          onPress={onActionPress}
          style={styles.actionButton}
          textStyle={styles.actionText}
          accessibilityLabel={accessibilityActionLabel || actionLabel}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: 28,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#F8F6F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 10,
  },
  body: {
    textAlign: "center",
    lineHeight: 26,
  },
  actionButton: {
    marginTop: 22,
    backgroundColor: "#556950",
    minHeight: 54,
    paddingHorizontal: 28,
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
