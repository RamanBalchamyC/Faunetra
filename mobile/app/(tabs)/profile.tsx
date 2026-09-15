import { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/providers/SessionProvider";
import { useAppTheme } from "@/hooks/useAppTheme";
import { COUNTRIES } from "@/lib/countries";
import type { WalletWithSpecies } from "@/lib/types";

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const { user, profile, refreshProfile, signOut } = useSession();
  const router = useRouter();
  const [name, setName] = useState(profile?.display_name ?? "");
  const [editingName, setEditingName] = useState(false);
  const [wallets, setWallets] = useState<WalletWithSpecies[]>([]);

  useEffect(() => setName(profile?.display_name ?? ""), [profile?.display_name]);

  const loadWallets = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("wallets").select("*, species(*)").eq("user_id", user.id);
    setWallets((data as WalletWithSpecies[]) ?? []);
  }, [user]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  async function saveName() {
    if (!user) return;
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 30) return;
    await supabase.from("profiles").update({ display_name: trimmed }).eq("id", user.id);
    setEditingName(false);
    refreshProfile();
  }

  async function chooseCountry(code: string) {
    if (!user) return;
    await supabase.from("profiles").update({ country_code: code || null }).eq("id", user.id);
    refreshProfile();
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Profile</Text>

      {editingName ? (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 16, alignItems: "center" }}>
          <TextInput
            value={name}
            onChangeText={setName}
            style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
          />
          <Pressable onPress={saveName} style={[styles.smallButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.smallButtonText}>Save</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => setEditingName(true)} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 17 }}>
            {profile?.display_name ?? user?.email} <Text style={{ color: colors.accent, fontSize: 12 }}>(edit)</Text>
          </Text>
        </Pressable>
      )}

      <Text style={[styles.label, { color: colors.textPrimary }]}>Country</Text>
      <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>
        Optional — shown on the leaderboard if you opt in.
      </Text>
      <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Picker
          selectedValue={profile?.country_code ?? ""}
          onValueChange={chooseCountry}
          style={{ color: colors.textPrimary }}
        >
          <Picker.Item label="Not specified" value="" />
          {COUNTRIES.map((c) => (
            <Picker.Item key={c.code} label={c.name} value={c.code} />
          ))}
        </Picker>
      </View>

      {(profile?.current_streak ?? 0) > 0 && (
        <View style={[styles.streakBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium" }}>
            🔥 {profile?.current_streak}-day discovery streak
          </Text>
        </View>
      )}

      <Text style={[styles.label, { color: colors.textPrimary }]}>Your collection</Text>
      {wallets.map((w) => (
        <View key={w.id} style={styles.collectionRow}>
          <Text style={{ color: colors.textPrimary, fontFamily: "Inter_400Regular", fontSize: 13 }}>
            {w.species.name} ({w.species.symbol})
          </Text>
          <Text style={{ color: colors.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
            {Number(w.balance).toLocaleString()}
          </Text>
        </View>
      ))}

      <View style={{ marginTop: 32, gap: 16 }}>
        <Pressable onPress={() => router.push("/profile/history" as never)}>
          <Text style={{ color: colors.accent, fontFamily: "Inter_500Medium" }}>Transaction History</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/profile/settings" as never)}>
          <Text style={{ color: colors.accent, fontFamily: "Inter_500Medium" }}>Settings</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/impact" as never)}>
          <Text style={{ color: colors.accent, fontFamily: "Inter_500Medium" }}>Impact Fund</Text>
        </Pressable>
        <Pressable onPress={signOut}>
          <Text style={{ color: colors.textMuted, fontFamily: "Inter_500Medium" }}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  title: { fontFamily: "Poppins_600SemiBold", fontSize: 20 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 24, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontFamily: "Inter_400Regular" },
  smallButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  smallButtonText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  pickerWrap: { borderWidth: 1, borderRadius: 8, overflow: "hidden", marginTop: 8 },
  streakBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 20 },
  collectionRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
});
