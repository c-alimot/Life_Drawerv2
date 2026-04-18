export const ENTRY_PREVIEW_PILLS = {
  rowGap: 8,
  rowMarginTop: 16,
  pillPaddingHorizontal: 10,
  pillPaddingVertical: 4,
  pillRadius: 999,
  borderWidth: 1,
  drawerBackground: "#E6E2D8",
  drawerBorder: "#556950",
  drawerText: "#556950",
  tagBackground: "#ECE6DB",
  tagBorder: "#DAC8B1",
  tagText: "#2F2924",
  textWeight: "500" as const,
};

function stripEmojiSafe(input: string): string {
  try {
    // Prefer Unicode property escapes when the current JS engine supports them.
    const emojiRegex = new RegExp("[\\p{Extended_Pictographic}\\uFE0F]", "gu");
    return input.replace(emojiRegex, "");
  } catch {
    // Fallback for engines that don't support Unicode property escapes.
    return input.replace(/[\uFE0F]/g, "");
  }
}

export function sanitizeEntryPreviewLabel(value: string): string {
  const sanitized = stripEmojiSafe(value).replace(/\s+/g, " ").trim();
  return sanitized || value;
}
