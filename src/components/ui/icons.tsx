import React from "react";
import * as LucideIcons from "lucide-react-native";
import type { StyleProp, ViewStyle } from "react-native";

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  strokeWidth?: number;
  [key: string]: unknown;
};

const ICON_NAME_MAP: Record<string, string> = {
  home: "House",
  magnify: "Search",
  chartLine: "ChartLine",
  "chart-line": "ChartLine",
  "chart-box-outline": "ChartColumn",
  "file-document-outline": "FileText",
  "file-document-edit-outline": "FilePenLine",
  "account-cog-outline": "UserCog",
  "archive-outline": "Rows3",
  "dots-vertical": "EllipsisVertical",
  "dots-horizontal": "Ellipsis",
  email: "Mail",
  password: "Lock",
  check: "Check",
  close: "X",
  "tune-variant": "SlidersHorizontal",
  "calendar-blank-outline": "CalendarDays",
  "emoticon-happy-outline": "Smile",
  "image-outline": "Image",
  mic: "Mic",
  "microphone-outline": "Mic",
  "play-circle-outline": "CirclePlay",
  "stop-circle-outline": "CircleStop",
  "map-marker": "MapPin",
  "tag-outline": "Tag",
  title: "Type",
  content: "AlignLeft",
  "trash-can-outline": "Trash2",
  "star-four-points": "Sparkles",
  "star-four-points-outline": "Sparkles",
  sparkles: "Sparkle",
  "sparkles-outline": "Sparkle",
  "timer-sand": "Hourglass",
  "account-edit-outline": "UserPen",
  "chevron-right": "ChevronRight",
  "label-outline": "Tag",
};

const FALLBACK_ICON = "Circle";
const LUCIDE_ICON_MAP = LucideIcons as unknown as Record<
  string,
  React.ComponentType<Record<string, unknown>>
>;

export const MaterialCommunityIcons = Object.assign(
  ({ name, size = 24, color = "#2F2924", style, strokeWidth = 1.7, ...rest }: IconProps) => {
    const iconKey = ICON_NAME_MAP[name] || FALLBACK_ICON;
    const IconComponent = LUCIDE_ICON_MAP[iconKey] || LUCIDE_ICON_MAP[FALLBACK_ICON];

    return (
      <IconComponent
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        style={style}
        {...rest}
      />
    );
  },
  {
    glyphMap: ICON_NAME_MAP,
  },
);
