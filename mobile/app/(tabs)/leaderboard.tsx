import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAppTheme } from "@/hooks/useAppTheme";
import { countryCodeToFlag } from "@/lib/countries";
import type { LeaderboardRow } from "@/lib/types";

export default function LeaderboardScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      supabase.rpc("get_leaderboard").then(({ data }) => {
        setRows((data as LeaderboardRow[]) ?? []);
        setLoading(false);
      });
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Leaderboard</Text>
      <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 }}>
        Ranked by total coins held. Opt-in only.
      </Text>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={{ paddingTop: 16 }}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular" }}>No one has opted in yet.</Text>
          ) : null
        }
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => router.push(`/leaderboard/${item.user_id}` as never)}
            style={[styles.row, { borderBottomColor: colors.border }]}
          >
            <Text style={{ color: colors.textMuted, width: 24, fontFamily: "Inter_400Regular" }}>{index + 1}</Text>
            <Text style={{ flex: 1, color: colors.textPrimary, fontFamily: "Inter_500Medium" }}>
              {item.country_code ? `${countryCodeToFlag(item.country_code)} ` : ""}
              {item.display_name}
            </Text>
            <Text style={{ color: colors.textPrimary, fontFamily: "Inter_600SemiBold" }}>
              {Number(item.total_balance).toLocaleString()}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontFamily: "Poppins_600SemiBold", fontSize: 20 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
