import { ENTRY_PREVIEW_PILLS, sanitizeEntryPreviewLabel } from "@constants/entryPreviewPills";
import { useTheme } from "@styles/theme";
import type { EntryWithRelations } from "@types";
import { MaterialCommunityIcons } from "@components/ui/icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "./Card";

interface EntryPreviewCardProps {
  entry: EntryWithRelations;
  onPress: () => void;
  onMenuPress?: () => void;
  drawerName?: string | null;
  showDate?: boolean;
  dateText?: string;
  showMeta?: boolean;
}

export function EntryPreviewCard({
  entry,
  onPress,
  onMenuPress,
  drawerName,
  showDate = false,
  dateText,
  showMeta = false,
}: EntryPreviewCardProps) {
  const theme = useTheme();
  const title = entry.title || "Untitled Entry";

  return (
    <Card style={styles.card} variant="elevated">
      {onMenuPress ? (
        <TouchableOpacity
          onPress={onMenuPress}
          style={styles.menuButton}
          accessible
          accessibilityLabel={`More options for ${title}`}
        >
          <MaterialCommunityIcons name="dots-vertical" size={22} color="#6F6860" />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        accessible
        accessibilityLabel={`Entry: ${title}`}
      >
        <Text
          numberOfLines={1}
          style={[
            theme.typography.h3,
            styles.title,
            { color: "#2F2924", fontFamily: theme.fonts.serif },
          ]}
        >
          {title}
        </Text>

        <Text numberOfLines={2} style={[theme.typography.bodySm, styles.body, { color: "#6F6860" }]}>
          {entry.content || ""}
        </Text>

        {showDate && dateText ? (
          <Text style={[theme.typography.bodySm, styles.date, { color: "#6F6860" }]}>
            {dateText}
          </Text>
        ) : null}

        {showMeta ? (
          <View style={styles.metaRow}>
            {entry.images && entry.images.length > 0 ? (
              <Text style={[theme.typography.labelXs, { color: "#8C9A7F" }]}>
                {entry.images.length} {entry.images.length === 1 ? "image" : "images"}
              </Text>
            ) : null}
            {entry.audioUrl ? (
              <Text style={[theme.typography.labelXs, { color: "#8C9A7F" }]}>Audio</Text>
            ) : null}
          </View>
        ) : null}

        {((entry.tags && entry.tags.length > 0) || drawerName || (entry.drawers && entry.drawers.length > 0)) ? (
          <View style={styles.tagsRow}>
            {drawerName ? (
              <View
                style={[
                  styles.pill,
                  {
                    backgroundColor: ENTRY_PREVIEW_PILLS.drawerBackground,
                    borderColor: ENTRY_PREVIEW_PILLS.drawerBorder,
                    borderWidth: ENTRY_PREVIEW_PILLS.borderWidth,
                  },
                ]}
              >
                <Text style={[theme.typography.labelXs, { color: ENTRY_PREVIEW_PILLS.drawerText, fontWeight: ENTRY_PREVIEW_PILLS.textWeight }]}>
                  {sanitizeEntryPreviewLabel(drawerName)}
                </Text>
              </View>
            ) : (
              entry.drawers?.map((drawer) => (
                <View
                  key={drawer.id}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: ENTRY_PREVIEW_PILLS.drawerBackground,
                      borderColor: ENTRY_PREVIEW_PILLS.drawerBorder,
                      borderWidth: ENTRY_PREVIEW_PILLS.borderWidth,
                    },
                  ]}
                >
                  <Text style={[theme.typography.labelXs, { color: ENTRY_PREVIEW_PILLS.drawerText, fontWeight: ENTRY_PREVIEW_PILLS.textWeight }]}>
                    {sanitizeEntryPreviewLabel(drawer.name)}
                  </Text>
                </View>
              ))
            )}
            {entry.tags?.map((tag) => (
              <View
                key={tag.id}
                style={[
                  styles.pill,
                  {
                    backgroundColor: ENTRY_PREVIEW_PILLS.tagBackground,
                    borderColor: ENTRY_PREVIEW_PILLS.tagBorder,
                    borderWidth: ENTRY_PREVIEW_PILLS.borderWidth,
                  },
                ]}
              >
                <Text style={[theme.typography.labelXs, { color: ENTRY_PREVIEW_PILLS.tagText, fontWeight: ENTRY_PREVIEW_PILLS.textWeight }]}>
                  {sanitizeEntryPreviewLabel(tag.name)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    borderRadius: 22,
    marginBottom: 14,
    paddingVertical: 18,
    paddingLeft: 18,
    paddingRight: 18,
  },
  menuButton: {
    position: "absolute",
    top: 10,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingRight: 34,
  },
  title: {
    fontWeight: "500",
    marginBottom: 8,
  },
  body: {
    marginBottom: 0,
  },
  date: {
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ENTRY_PREVIEW_PILLS.rowGap,
    marginTop: ENTRY_PREVIEW_PILLS.rowMarginTop,
  },
  pill: {
    paddingHorizontal: ENTRY_PREVIEW_PILLS.pillPaddingHorizontal,
    paddingVertical: ENTRY_PREVIEW_PILLS.pillPaddingVertical,
    borderRadius: ENTRY_PREVIEW_PILLS.pillRadius,
  },
});
