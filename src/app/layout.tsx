import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { getOptionalUser } from "@/lib/auth";
import type { ThemePreference } from "@/lib/types";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Headline font (login page only, per the Phase 3 brief) — a touch more
// personality than Inter without abandoning it for body/UI text.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Faunetra",
  description: "Mine coins for real endangered ocean species. Coins are symbolic — not real currency.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Resolve the user's theme preference server-side so the correct theme
  // renders on first paint — no client-side flash of the wrong theme.
  // 'system' (including signed-out visitors) sets no attribute at all and
  // lets the prefers-color-scheme media query in globals.css decide.
  const { supabase, user } = await getOptionalUser();
  let theme: ThemePreference = "system";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("theme_preference")
      .eq("id", user.id)
      .single<{ theme_preference: ThemePreference }>();
    if (profile?.theme_preference) theme = profile.theme_preference;
  }

  return (
    <html
      lang="en"
      data-theme={theme === "system" ? undefined : theme}
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-text-primary">{children}</body>
    </html>
  );
}
