import { View, Text, Pressable, Switch, StyleSheet } from "react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/providers/SessionProvider";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { ThemePreference } from "@/lib/types";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const { user, profile, refreshProfile } = useSession();

  async function setTheme(value: ThemePreference) {
    if (!user) return;
    await supabase.from("profiles").update({ theme_preference: value }).eq("id", user.id);
    refreshProfile();
  }

  async function toggleLeaderboard(value: boolean) {
    if (!user) return;
    await supabase.from("profiles").update({ leaderboard_opt_in: value }).eq("id", user.id);
    refreshProfile();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.section, { color: colors.textPrimary }]}>Appearance</Text>
      <View style={[styles.segmented, { borderColor: colors.border }]}>
        {THEME_OPTIONS.map((opt) => {
          const active = (profile?.theme_preference ?? "system") === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setTheme(opt.value)}
              style={[styles.segment, active && { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: active ? "#fff" : colors.textMuted, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.section, { color: colors.textPrimary, marginTop: 32 }]}>Leaderboard</Text>
      <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 8 }}>
        Off by default. When on, your name, country flag, and collection totals are visible to
        other signed-in users.
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Switch
          value={profile?.leaderboard_opt_in ?? false}
          onValueChange={toggleLeaderboard}
          trackColor={{ true: colors.primary }}
        />
        <Text style={{ color: colors.textPrimary, fontFamily: "Inter_400Regular" }}>Show me on the leaderboard</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  section: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  segmented: { flexDirection: "row", borderWidth: 1, borderRadius: 8, overflow: "hidden", marginTop: 10, alignSelf: "flex-start" },
  segment: { paddingVertical: 8, paddingHorizontal: 16 },
});
