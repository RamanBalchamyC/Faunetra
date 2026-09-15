import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Linking, Pressable } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { Species } from "@/lib/types";

type ImpactFundLogEntry = {
  id: string;
  total_coins_pledged_at_time: number;
  amount_donated_inr: number;
  recipient_org: string;
  receipt_url: string | null;
  donated_at: string;
  note: string | null;
};

export default function ImpactScreen() {
  const { colors } = useAppTheme();
  const [totalMined, setTotalMined] = useState(0);
  const [log, setLog] = useState<ImpactFundLogEntry[]>([]);

  useEffect(() => {
    supabase
      .from("species")
      .select("circulating_supply")
      .then(({ data }) => {
        const rows = (data as Pick<Species, "circulating_supply">[]) ?? [];
        setTotalMined(rows.reduce((sum, s) => sum + Number(s.circulating_supply), 0));
      });
    supabase
      .from("impact_fund_log")
      .select("*")
      .order("donated_at", { ascending: false })
      .then(({ data }) => setLog((data as ImpactFundLogEntry[]) ?? []));
  }, []);

  const totalDonated = log.reduce((sum, l) => sum + Number(l.amount_donated_inr), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 13 }}>
        Faunetra coins are symbolic — pledging them does not move real money. This page tracks the
        developer&apos;s own, separate, real donations — not a corporate partnership.
      </Text>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>
            Coins mined platform-wide
          </Text>
          <Text style={{ color: colors.textPrimary, fontFamily: "Poppins_600SemiBold", fontSize: 20 }}>
            {totalMined.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.statCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>
            Real donations to date
          </Text>
          <Text style={{ color: colors.textPrimary, fontFamily: "Poppins_600SemiBold", fontSize: 20 }}>
            ₹{totalDonated.toLocaleString()}
          </Text>
        </View>
      </View>

      <Text style={{ color: colors.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 15, marginTop: 24 }}>
        Donation log
      </Text>
      <FlatList
        data={log}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingTop: 8 }}
        ListEmptyComponent={
          <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular" }}>No donations logged yet.</Text>
        }
        renderItem={({ item }) => (
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                {item.recipient_org}
              </Text>
              <Text style={{ color: colors.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                ₹{Number(item.amount_donated_inr).toLocaleString()}
              </Text>
            </View>
            <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 11 }}>
              {new Date(item.donated_at).toLocaleDateString()}
            </Text>
            {item.receipt_url && (
              <Pressable onPress={() => Linking.openURL(item.receipt_url!)}>
                <Text style={{ color: colors.accent, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                  View receipt
                </Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 14 },
});
