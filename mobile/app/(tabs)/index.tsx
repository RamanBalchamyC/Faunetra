import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/providers/SessionProvider";
import { useAppTheme } from "@/hooks/useAppTheme";
import { RARITY_TIER_COLOR_KEY } from "@/constants/theme";
import type { WalletWithSpecies } from "@/lib/types";

export default function WalletScreen() {
  const { colors } = useAppTheme();
  const { user } = useSession();
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletWithSpecies[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("wallets")
      .select("*, species(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setWallets((data as WalletWithSpecies[]) ?? []);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.primary }]}>Your Wallet</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Coins have no real-world monetary value.
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/send" as never)}
            style={[styles.smallButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.smallButtonText}>Send</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/profile/history" as never)}
            style={[styles.smallButtonOutline, { borderColor: colors.border }]}
          >
            <Text style={[styles.smallButtonOutlineText, { color: colors.textPrimary }]}>History</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={wallets}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        contentContainerStyle={{ gap: 12, paddingTop: 16 }}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular" }}>
              No wallets yet — they&apos;re created automatically on sign-up.
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const tierColorKey = RARITY_TIER_COLOR_KEY[item.species.rarity_tier] ?? "textMuted";
          return (
            <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.speciesName, { color: colors.textMuted }]}>{item.species.name}</Text>
                <View style={[styles.tierPill, { backgroundColor: colors[tierColorKey] + "22" }]}>
                  <Text style={[styles.tierPillText, { color: colors[tierColorKey] }]}>
                    {item.species.rarity_tier}
                  </Text>
                </View>
              </View>
              <Text style={[styles.balance, { color: colors.textPrimary }]}>
                {Number(item.balance).toLocaleString()}
                <Text style={[styles.symbol, { color: colors.textMuted }]}> {item.species.symbol}</Text>
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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 },
  headerActions: { flexDirection: "row", gap: 8 },
  title: { fontFamily: "Poppins_600SemiBold", fontSize: 20 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2, maxWidth: 220 },
  smallButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  smallButtonText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  smallButtonOutline: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1 },
  smallButtonOutlineText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  speciesName: { fontFamily: "Inter_500Medium", fontSize: 13 },
  tierPill: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  tierPillText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  balance: { fontFamily: "Poppins_600SemiBold", fontSize: 24, marginTop: 8 },
  symbol: { fontFamily: "Inter_400Regular", fontSize: 13 },
});
