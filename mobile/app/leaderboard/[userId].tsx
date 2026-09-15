import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAppTheme } from "@/hooks/useAppTheme";
import { RARITY_TIER_COLOR_KEY } from "@/constants/theme";
import { countryCodeToFlag, countryName } from "@/lib/countries";
import type { PublicProfileRow } from "@/lib/types";

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { colors } = useAppTheme();
  const [rows, setRows] = useState<PublicProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc("get_public_profile", { p_user_id: userId }).then(({ data }) => {
      setRows((data as PublicProfileRow[]) ?? []);
      setLoading(false);
    });
  }, [userId]);

  if (!loading && rows.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular" }}>
          This user isn&apos;t visible on the public leaderboard — they may have opted out, hold no
          coins, or the profile doesn&apos;t exist.
        </Text>
      </View>
    );
  }

  const { display_name, country_code } = rows[0] ?? {};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {rows.length > 0 && (
        <View style={styles.headerRow}>
          {country_code && <Text style={{ fontSize: 24 }}>{countryCodeToFlag(country_code)}</Text>}
          <Text style={{ color: colors.textPrimary, fontFamily: "Poppins_600SemiBold", fontSize: 18 }}>
            {display_name}
          </Text>
        </View>
      )}
      {country_code && (
        <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>
          {countryName(country_code)}
        </Text>
      )}

      <Text style={{ color: colors.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 15, marginTop: 20 }}>
        Collection
      </Text>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.species_symbol}
        contentContainerStyle={{ gap: 8, paddingTop: 8 }}
        renderItem={({ item }) => {
          const tierColorKey = RARITY_TIER_COLOR_KEY[item.rarity_tier] ?? "textMuted";
          return (
            <View style={styles.speciesRow}>
              <Text style={{ color: colors.textPrimary, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                {item.species_name} ({item.species_symbol}){" "}
                <Text style={{ color: colors[tierColorKey], fontSize: 11 }}>{item.rarity_tier}</Text>
              </Text>
              <Text style={{ color: colors.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                {Number(item.balance).toLocaleString()}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  speciesRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
});
