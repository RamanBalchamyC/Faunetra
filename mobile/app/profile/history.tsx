import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/providers/SessionProvider";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { Species, Transaction } from "@/lib/types";

type TxRow = Transaction & { species: Species };

export default function HistoryScreen() {
  const { colors } = useAppTheme();
  const { user } = useSession();
  const [walletIds, setWalletIds] = useState<Set<string>>(new Set());
  const [transactions, setTransactions] = useState<TxRow[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("wallets")
      .select("id")
      .eq("user_id", user.id)
      .then(({ data }) => setWalletIds(new Set((data ?? []).map((w) => w.id))));

    supabase
      .from("transactions")
      .select("*, species(*)")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setTransactions((data as TxRow[]) ?? []));
  }, [user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular" }}>No transactions yet.</Text>
        }
        renderItem={({ item }) => {
          const direction = walletIds.has(item.to_wallet_id ?? "") ? "in" : walletIds.has(item.from_wallet_id ?? "") ? "out" : "neutral";
          const color = direction === "in" ? colors.success : direction === "out" ? colors.error : colors.textMuted;
          return (
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                  {formatType(item.type)}
                </Text>
                <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 11 }}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </View>
              <Text style={{ color, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                {direction === "in" ? "+" : direction === "out" ? "-" : ""}
                {Number(item.amount).toLocaleString()} {item.species.symbol}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

function formatType(type: Transaction["type"]) {
  switch (type) {
    case "INITIAL_GRANT":
      return "Initial grant";
    case "MINING_REWARD":
      return "Mining reward";
    case "TRANSFER":
      return "Transfer";
    case "PLEDGE":
      return "Pledge";
    default:
      return type;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
});
