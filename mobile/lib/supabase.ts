import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — copy .env.local.example to .env.local and fill them in."
  );
}

// Same Supabase project as the Next.js web app (same URL/anon key) — no
// separate backend, no schema duplication.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // On native, Supabase needs an explicit storage adapter (AsyncStorage).
    // On web, omitting `storage` lets it use the browser's localStorage.
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});
