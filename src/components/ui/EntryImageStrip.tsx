import { useTheme } from "@styles/theme";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EntryImageStripProps {
  title?: string;
  items: string[];
  titleColor: string;
  onRemove: (item: string, index: number) => void;
  getItemAccessibilityLabel: (index: number, item: string) => string;
}

export function EntryImageStrip({
  title,
  items,
  titleColor,
  onRemove,
  getItemAccessibilityLabel,
}: EntryImageStripProps) {
  const theme = useTheme();

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      {title ? (
        <Text
          style={[
            theme.typography.labelSm,
            {
              color: titleColor,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          {title}
        </Text>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(_, index) => `entry-image-${index}`}
        horizontal
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: item }}
              style={styles.image}
              accessible
              accessibilityLabel={getItemAccessibilityLabel(index, item)}
            />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => onRemove(item, index)}
              accessible
              accessibilityLabel="Remove image"
            >
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrapper: {
    position: "relative",
    marginRight: 12,
    marginBottom: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
