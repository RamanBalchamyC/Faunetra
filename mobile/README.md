# Faunetra Mobile

Expo (React Native + react-native-web) port of the Faunetra web app, connected to the **same
Supabase project** — no separate backend, no schema duplication. See the root [README](../README.md)
and `../faunetra-build-prompt.md` for the product brief; this file only covers what's specific to
this Expo codebase.

## Run it

```
cd mobile
cp .env.local.example .env.local   # fill in the same Supabase URL/anon key as the web app's .env.local
npm install
npm run web       # or: npm run ios / npm run android (needs a simulator/device)
```

## What's implemented

- **Auth**: Google OAuth via Supabase — browser-redirect flow (`expo-web-browser` +
  `expo-auth-session`-style redirect handling) rather than the native
  `@react-native-google-signin/google-signin` SDK, since that requires a custom dev-client build
  and isn't testable in plain Expo Go. `app/login.tsx`; session/profile state lives in
  `providers/SessionProvider.tsx`, consumed everywhere via `useSession()`.
- **Auth guard**: `app/_layout.tsx` redirects signed-out users to `/login` and signed-in users
  away from it — the Expo Router equivalent of the web app's `src/proxy.ts` middleware. `/login`
  and `/impact` are the public routes.
- **Tabs**: Wallet / Mining / Leaderboard / Profile (`app/(tabs)/`). Send lives at `app/send.tsx`
  (pushed from Wallet); History and Settings live under `app/profile/` (pushed from Profile).
- **Mining Hub**: same trivia-based flow as the web app — `lib/species-trivia.ts` and
  `lib/mining-questions.ts` are copied verbatim (plain TS, no framework-specific imports).
- **Theme**: `constants/theme.ts` mirrors the web app's CSS custom properties as a plain object;
  `hooks/useAppTheme.ts` resolves `profiles.theme_preference` combined with React Native's
  `useColorScheme()` for the "system" option.
- **Fonts**: Inter + Poppins via `@expo-google-fonts/*`, loaded through `expo-font`.
- **Country flags**: rendered as Unicode emoji (`lib/countries.ts`) — unlike the web app, which
  switched to an SVG library after discovering Windows browsers don't render flag emoji. iOS and
  Android both render flag emoji correctly natively, so this simpler approach is fine here. If
  this app is ever exported to web (`expo export --platform web`) and viewed on Windows, that
  same issue would resurface — swap to a `react-native-svg`-based flag set at that point.

## Not yet built

- **AI assistant**: not ported yet. The plan (per the migration brief) is a Supabase Edge
  Function calling Gemini, callable identically from web/iOS/Android via
  `supabase.functions.invoke()` — this needs the Supabase CLI logged into your account to deploy,
  which wasn't available in the environment this was built in. Ask to have this built next.
- Real on-device testing (Android/iOS) — only the web target has been smoke-tested so far
  (`npx expo start --web`, bundle compiles and renders without errors). Test on a real device via
  Expo Go before trusting this on a phone.
- Pledges, the Impact Fund donation-log receipt flow beyond a plain link-out, and the daily-limit
  countdown UX polish (attempts-remaining is shown, but no "come back tomorrow" specific state).
- `eas build -p android --profile preview` for a sideloadable APK — not run yet.
