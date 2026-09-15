import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { useAppTheme } from "@/hooks/useAppTheme";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setError(null);
    setLoading(true);
    try {
      if (Platform.OS === "web") {
        // Web: detectSessionInUrl (see lib/supabase.ts) handles the
        // redirect back automatically — same flow as the Next.js app.
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
        return;
      }

      // Native: open the OAuth URL in an in-app browser, then parse the
      // access/refresh tokens back out of the redirect deep link — see
      // https://faunetra.app (scheme set in app.json) for the redirect
      // target. Requires this exact redirect added in both Supabase
      // (Authentication -> URL Configuration) and left as the Google
      // Cloud OAuth client's existing Supabase callback (unchanged).
      const redirectTo = Linking.createURL("/");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) throw new Error("No OAuth URL returned.");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success" || !result.url) {
        setLoading(false);
        return; // user cancelled — not an error
      }

      const params = new URLSearchParams(result.url.split("#")[1] ?? result.url.split("?")[1]);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (!access_token || !refresh_token) {
        throw new Error("Sign-in redirect did not include session tokens.");
      }

      const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
      if (sessionError) throw sessionError;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}>Faunetra</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Mine coins for real endangered species and track a transparent, symbolic conservation
        impact.
      </Text>

      <Pressable
        onPress={signInWithGoogle}
        disabled={loading}
        style={[styles.button, { borderColor: colors.border, backgroundColor: colors.surface }]}
      >
        <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
          {loading ? "Signing in…" : "Continue with Google"}
        </Text>
      </Pressable>

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}

      <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
        Coins have no real-world monetary value. Pledges are symbolic; see the{" "}
        <Text style={{ color: colors.accent }} onPress={() => router.push("/impact" as never)}>
          Impact Fund
        </Text>{" "}
        page for the developer&apos;s real, separately-logged donations.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 20 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 28 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", maxWidth: 320 },
  button: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  buttonText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  error: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", maxWidth: 320 },
  disclaimer: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center", maxWidth: 320 },
});
