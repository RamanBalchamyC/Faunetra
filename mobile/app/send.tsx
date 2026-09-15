import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/providers/SessionProvider";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { WalletWithSpecies } from "@/lib/types";

export default function SendScreen() {
  const { colors } = useAppTheme();
  const { user } = useSession();
  const [wallets, setWallets] = useState<WalletWithSpecies[]>([]);
  const [speciesId, setSpeciesId] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "error" | "success"; message?: string }>({
    kind: "idle",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("wallets")
      .select("*, species(*)")
      .eq("user_id", user.id)
      .gt("balance", 0)
      .then(({ data }) => {
        const rows = (data as WalletWithSpecies[]) ?? [];
        setWallets(rows);
        if (rows[0]) setSpeciesId(rows[0].species_id);
      });
  }, [user]);

  async function send() {
    if (!user) return;
    setStatus({ kind: "loading" });

    const { data: recipientId, error: lookupError } = await supabase.rpc("find_user_by_email", {
      p_email: recipientEmail.trim().toLowerCase(),
    });
    if (lookupError) return setStatus({ kind: "error", message: lookupError.message });
    if (!recipientId) return setStatus({ kind: "error", message: "No Faunetra user found with that email." });
    if (recipientId === user.id) return setStatus({ kind: "error", message: "You can't send coins to yourself." });

    const idempotencyKey = `${Date.now()}-${Math.random()}`;
    const { error: transferError } = await supabase.rpc("transfer_coins", {
      p_from_user_id: user.id,
      p_to_user_id: recipientId,
      p_species_id: speciesId,
      p_amount: Number(amount),
      p_idempotency_key: idempotencyKey,
    });
    if (transferError) return setStatus({ kind: "error", message: transferError.message });

    setStatus({ kind: "success", message: `Sent ${amount} coins.` });
    setAmount("");
  }

  const selected = wallets.find((w) => w.species_id === speciesId);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>Recipient email</Text>
      <TextInput
        value={recipientEmail}
        onChangeText={setRecipientEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="friend@example.com"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
      />

      <Text style={[styles.label, { color: colors.textPrimary }]}>Species</Text>
      <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Picker selectedValue={speciesId} onValueChange={setSpeciesId} style={{ color: colors.textPrimary }}>
          {wallets.map((w) => (
            <Picker.Item
              key={w.species_id}
              label={`${w.species.name} (${w.species.symbol}) — ${Number(w.balance).toLocaleString()}`}
              value={w.species_id}
            />
          ))}
        </Picker>
      </View>

      <Text style={[styles.label, { color: colors.textPrimary }]}>Amount</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
      />

      <Pressable
        onPress={send}
        disabled={status.kind === "loading" || !recipientEmail || !amount || !speciesId}
        style={[styles.button, { backgroundColor: colors.primary, opacity: status.kind === "loading" ? 0.6 : 1 }]}
      >
        <Text style={styles.buttonText}>{status.kind === "loading" ? "Sending…" : "Send coins"}</Text>
      </Pressable>

      {status.kind === "error" && <Text style={{ color: colors.error, marginTop: 12 }}>{status.message}</Text>}
      {status.kind === "success" && <Text style={{ color: colors.success, marginTop: 12 }}>{status.message}</Text>}
      {selected && (
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 12 }}>
          Balance: {Number(selected.balance).toLocaleString()} {selected.species.symbol}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 4 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontFamily: "Inter_400Regular", fontSize: 14 },
  pickerWrap: { borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  button: { marginTop: 24, borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
