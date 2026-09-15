# Faunetra

A species-themed rewards app: users "mine" coins representing rare and endangered animals,
send them to friends, and symbolically pledge them toward conservation causes. Coins have no
real monetary value; the Impact Fund page tracks the developer's real, separately-logged personal
donations. See `faunetra-build-prompt.md` for the full product/architecture brief this was built
from.

## Stack

- Next.js (App Router, TypeScript) — deployed on Vercel
- Supabase (Postgres, Auth w/ Google OAuth, Row Level Security)
- All balance-changing logic lives in Postgres `security definer` RPC functions — the client
  never writes to `wallets` or `transactions` directly.

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. In **Project Settings → API**, copy the **Project URL** and **anon public key**.
3. Copy `.env.local.example` to `.env.local` and fill those in:
   ```
   cp .env.local.example .env.local
   ```

## 2. Apply the schema

Open the Supabase SQL Editor and run, in order:

1. `supabase/migrations/0001_init.sql` — tables, RLS policies, and RPC functions
   (`grant_initial_balance`, `find_user_by_email`, `transfer_coins`, `start_mining_session`,
   `settle_mining_session`, `pledge_coins`, `get_leaderboard`), plus the `on_auth_user_created`
   trigger that provisions a profile + starter wallets the moment someone signs up.
2. `supabase/seed.sql` — the starter species roster (Butterfly, Shark, Rhino, Amur Leopard).
3. `supabase/migrations/0002_ocean_species_and_iucn_tiers.sql` — Phase 2: relabels rarity tiers to
   real IUCN Red List categories, adds species metadata columns for the sync script, and retires
   the non-marine placeholders (safe to run even with existing test wallets/transactions — see
   the comment at the top of the file).
4. `supabase/migrations/0003_theme_avatar_leaderboard_trivia.sql` — Phase 3: `theme_preference` on
   profiles, `get_public_profile` RPC for the leaderboard's tap-through view, `get_leaderboard`
   extended to return id/avatar (superseded by 0004 below), and a daily attempt cap added to
   `start_mining_session` for the trivia-based mining flow.
5. `supabase/migrations/0004_country_streaks_question_history.sql` — Phase 3 update: drops
   `avatar_id`, adds `country_code` (replaces the avatar picker with a country/flag selector),
   adds a `mining_question_seen` table so trivia stops repeating within a session, and adds a
   daily mining streak maintained inside `settle_mining_session`.

(If you have the Supabase CLI linked to the project instead, `supabase db push` +
`supabase db execute -f supabase/seed.sql` do the same thing.)

## 2b. Populate real ocean species (Phase 2)

```
npm run sync:species
```

Pulls ~24 curated ocean species from WoRMS + GBIF (both free, no key) and upserts them into
`species`. Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (Project Settings → API →
service_role — **never commit this or share it in chat**, it bypasses RLS). Without an
`IUCN_API_TOKEN` set, conservation status comes from a curated fallback list flagged in each
row's `source_note` as unverified — check against [redlist.org](https://www.iucnredlist.org)
before treating those as authoritative. Safe to re-run any time (upserts by `symbol`).

## 3. Enable Google sign-in

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an
   OAuth 2.0 Client ID (type: Web application).
2. Add this Authorized redirect URI (find your project ref in the Supabase dashboard URL):
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
3. In Supabase: **Authentication → Providers → Google**, paste the Client ID and Client Secret,
   and enable the provider.
4. In **Authentication → URL Configuration**, add your app's callback as an additional Redirect
   URL, e.g. `http://localhost:3000/auth/callback` for local dev (and your Vercel URL once
   deployed).

## 4. Run it

```
npm install
npm run dev
```

Visit `http://localhost:3000`, sign in with Google, and you should land on `/wallet` with starter
balances already minted (via the `on_auth_user_created` trigger → `grant_initial_balance`).

## What's implemented

- **Auth**: Google OAuth via Supabase (`src/app/login`, `src/app/auth/callback`), with
  `src/proxy.ts` (Next.js 16's renamed `middleware.ts`) refreshing sessions and gating every
  route except `/login`, `/auth/callback`, and the public `/impact` page.
- **Wallet** (`/wallet`): the user's per-species balances.
- **Send** (`/send`): transfer coins to another user by email, via `POST /api/transfer` →
  `transfer_coins` RPC (row-locked, idempotency-keyed, server-validated balance).
- **Navigation**: primary nav is Wallet / Mining / Leaderboard / Profile. Send lives on the
  Wallet page; History and Settings live under Profile; Impact Fund is a footer link (kept
  reachable by signed-out visitors, not tucked inside account nav).
- **Mining Hub** (`/mining`): trivia-based "discovery" flow — pick a species, answer a 3-question
  True/False conservation-trivia round (`src/lib/species-trivia.ts`, authored from general
  knowledge like the sync script's IUCN fallback — spot-check before treating as fact; currently
  6 questions/species, a step toward a 15-20 target), then `start_mining_session` +
  `settle_mining_session` fire back-to-back with the quiz score as `contribution_score`. A
  `mining_question_seen` table (`src/lib/mining-questions.ts`) prioritizes unseen questions
  before recycling any, so a normal session doesn't repeat the same 3. Capped at 5
  attempts/species/day, enforced server-side. Settling a session also maintains a daily
  discovery streak (`profiles.current_streak`/`longest_streak`, shown on Mining Hub + Profile) —
  computed entirely server-side from `mining_sessions` timestamps, not client-trusted. The
  underlying reward formula is untouched from Phase 1/2.
- **History** (`/history`): ledger view, filterable by species/type.
- **Impact Fund** (`/impact`, public): total coins mined platform-wide + the real donation log
  (`impact_fund_log`), explicitly labeled as a founder-funded pledge, not a corporate program.
- **Leaderboard** (`/leaderboard`, `/leaderboard/[userId]`): ranked by total coins held, opt-in
  only (`get_leaderboard` RPC), with each user's country flag (if set) next to their name. Tapping
  a row opens a public profile view sourced from `get_public_profile` — a security-definer RPC
  that returns only display name, country, and per-species totals for opted-in users, rather than
  relaxing RLS on `wallets`/`profiles` directly. No transaction history, email, or transfer
  activity is ever exposed there.
- **Profile** (`/profile`): editable display name (length + basic profanity check,
  `src/lib/profanity.ts` — a simple blocklist, not a real moderation system), an optional country
  selector (`src/components/CountrySelector.tsx` — a native `<select>` with flag emoji computed
  from the ISO code, `src/lib/countries.ts`; no flag-image package or avatar illustrations to
  maintain), the discovery streak, the collection summary, and links to History/Settings/Sign out.
- **Settings** (`/settings`): theme preference (light/dark/system) and the leaderboard opt-in.
- **Theming**: light + dark palettes as CSS custom properties in `src/app/globals.css`. `system`
  follows `prefers-color-scheme` with no `data-theme` attribute; `light`/`dark` set `data-theme`
  on `<html>` explicitly. Resolved **server-side** from the user's `profiles.theme_preference` in
  `src/app/layout.tsx` — no client-side flash of the wrong theme. Persisted to the profile row
  (syncs across devices), not just `localStorage`.
- **Design system**: brand tokens in `src/app/globals.css`, Inter (body) + Poppins (login
  headline only) via `next/font`, rarity-tier color coding in `src/lib/design.ts`. The real logo
  is a vector SVG (`public/logo/octopus.svg`, traced from `src/assets/logo/octopus.jpg` via
  `scripts/vectorize-logo.mjs` — stays crisp at any zoom, unlike the earlier PNG-only version),
  used for the nav mark, favicon (`src/app/icon.svg`), apple-touch-icon, and the assistant FAB. A
  subtle node-network background texture sits behind the login page
  (`src/components/NetworkBackground.tsx`).
- **AI Assistant** (`/api/assistant`, floating action button on every signed-in screen): calls
  the Google Gemini API (free tier — no billing card required, unlike Anthropic's API) grounded
  in `src/lib/assistant-context.ts` — keep that file current as the product changes. Requires
  `GEMINI_API_KEY` from [aistudio.google.com/apikey](https://aistudio.google.com/apikey);
  defaults to `gemini-3.6-flash`. Text-only, non-streaming, capped history/message length as a
  lightweight cost/quota guard — not real rate limiting. Free-tier limits change over time; check
  [ai.google.dev/pricing](https://ai.google.dev/pricing) if it starts erroring under load.

## Non-negotiables this scaffold follows (see the build prompt for the full list)

- The frontend is never trusted for balance/authorization decisions — every RPC re-derives state
  and checks `auth.uid()` itself, since `security definer` bypasses RLS.
- No claims of real donations, corporate partnerships, or monetary coin value anywhere in the UI.
- Pledges are explicitly symbolic and labeled as such; the Impact Fund page separates that from
  the developer's real donation log.

## Not yet built

- Mobile (Expo) wrapper and `.apk` build — see Section 2 of the build prompt for the intended
  approach once the web app is stable.
- A less gameable mining contribution signal — the quiz score is still client-reported (clamped
  server-side), so a determined user could still inspect network calls to find answers. Fine for
  a small friends-only trial, not for anything wider.
- The full 15-20 questions/species trivia target (currently 6/species) — a larger content-
  authoring pass; the seen-question-tracking architecture is already in place to support it.
- Weekly species spotlight, achievement badges, and a second mini-game type alongside trivia —
  good candidates for a following phase per the engagement-mechanics brief.
- Voice AI and ML-based contribution scoring — explicitly deferred.
