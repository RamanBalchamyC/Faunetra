import { useColorScheme } from "react-native";
import { colors, type AppColors } from "@/constants/theme";
import { useSession } from "@/providers/SessionProvider";

// Resolves the same three-way preference as the web app
// (profiles.theme_preference: 'light' | 'dark' | 'system') combined with
// the OS setting via React Native's useColorScheme() for 'system'.
export function useAppTheme(): { scheme: "light" | "dark"; colors: AppColors } {
  const rawSystemScheme = useColorScheme();
  const systemScheme: "light" | "dark" = rawSystemScheme === "dark" ? "dark" : "light";
  const { profile } = useSession();
  const preference = profile?.theme_preference ?? "system";
  const scheme = preference === "system" ? systemScheme : preference;
  return { scheme, colors: colors[scheme] };
}
