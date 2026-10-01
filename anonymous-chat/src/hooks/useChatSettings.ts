import { useStore } from "@/store";
import { useTheme } from "@/hooks/useTheme";
import type { ChatWallpaper, FontSizeOption } from "@/types";

const WALLPAPER_COLORS: Record<ChatWallpaper, { light: string; dark: string }> = {
  default: { light: "#ece5dd", dark: "#000000" },
  dark: { light: "#2d3436", dark: "#000000" },
  gradient1: { light: "#667eea", dark: "#1a1040" },
  gradient2: { light: "#f5e6f0", dark: "#1a0a14" },
  gradient3: { light: "#e0f4ff", dark: "#0a1a20" },
  solid1: { light: "#dfe6e9", dark: "#0d1117" },
  solid2: { light: "#ddffd9", dark: "#0a1a08" },
  solid3: { light: "#ffecd2", dark: "#1a150a" },
};

const FONT_SIZES: Record<FontSizeOption, number> = {
  small: 13,
  normal: 15,
  large: 18,
};

export function useChatWallpaper(): string {
  const wallpaper = useStore((s) => s.settings.chatWallpaper);
  const { isDark } = useTheme();
  const wp = WALLPAPER_COLORS[wallpaper] || WALLPAPER_COLORS.default;
  return isDark ? wp.dark : wp.light;
}

export function useFontSize(): number {
  const fontSize = useStore((s) => s.settings.fontSize);
  return FONT_SIZES[fontSize] || FONT_SIZES.normal;
}
