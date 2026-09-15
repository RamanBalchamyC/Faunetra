// Same brand tokens as the web app's src/app/globals.css (Phase 2/3 design
// system) — ported to a plain object since React Native has no CSS custom
// properties. Keep these two in sync manually if the palette changes.
export type AppColors = {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  textPrimary: string;
  textMuted: string;
  success: string;
  warning: string;
  error: string;
  endangered: string;
  border: string;
};

export const colors: { light: AppColors; dark: AppColors } = {
  light: {
    primary: "#0d3b3e",
    accent: "#3a9188",
    background: "#fafaf8",
    surface: "#ffffff",
    textPrimary: "#1a1a1a",
    textMuted: "#6b7280",
    success: "#2f9e5c",
    warning: "#d97706",
    error: "#dc2626",
    endangered: "#c2410c",
    border: "#e5e2dc",
  },
  dark: {
    primary: "#4fd1c5",
    accent: "#38bdf8",
    background: "#0f1414",
    surface: "#1a2323",
    textPrimary: "#f3f4f2",
    textMuted: "#9ca3af",
    success: "#4ade80",
    warning: "#fbbf24",
    error: "#f87171",
    endangered: "#fb923c",
    border: "#2a3434",
  },
};

// Rarity tier -> color key, matching the web app's src/lib/design.ts.
export const RARITY_TIER_COLOR_KEY: Record<string, keyof AppColors> = {
  "Least Concern": "textMuted",
  "Near Threatened": "accent",
  Vulnerable: "warning",
  Endangered: "endangered",
  "Critically Endangered": "primary",
};
