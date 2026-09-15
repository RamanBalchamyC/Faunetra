import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { SessionProvider, useSession } from "@/providers/SessionProvider";
import { useAppTheme } from "@/hooks/useAppTheme";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SessionProvider>
      <RootLayoutNav />
    </SessionProvider>
  );
}

// Auth guard — the Expo Router equivalent of the web app's src/proxy.ts
// middleware: redirect signed-out users to /login, and signed-in users
// away from /login, based purely on session state (never client-trusted
// for anything beyond routing — actual data access is still gated by RLS).
function useAuthGuard() {
  const { session, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const onLoginScreen = segments[0] === "login";
    const onPublicRoute = onLoginScreen || segments[0] === "impact";

    if (!session && !onPublicRoute) {
      router.replace("/login");
    } else if (session && onLoginScreen) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments, router]);
}

function RootLayoutNav() {
  useAuthGuard();
  const { scheme, colors } = useAppTheme();

  const navTheme = {
    ...(scheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="send" options={{ title: "Send Coins" }} />
        <Stack.Screen name="impact" options={{ title: "Impact Fund" }} />
        <Stack.Screen name="leaderboard/[userId]" options={{ title: "Profile" }} />
        <Stack.Screen name="profile/history" options={{ title: "Transaction History" }} />
        <Stack.Screen name="profile/settings" options={{ title: "Settings" }} />
      </Stack>
    </ThemeProvider>
  );
}
