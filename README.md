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
- **Mining Hub** (`/mining`): start/stop a session (`start_mining_session` /
  `settle_mining_session`), with a live elapsed-time and contribution-score display. The reward
  formula and the "contribution score" input are placeholders — see the comments in
  `supabase/migrations/0001_init.sql` above `settle_mining_session` before treating this as
  abuse-resistant.
- **History** (`/history`): ledger view, filterable by species/type.
- **Impact Fund** (`/impact`, public): total coins mined platform-wide + the real donation log
  (`impact_fund_log`), explicitly labeled as a founder-funded pledge, not a corporate program.
- **Profile** (`/profile`): collection summary + an opt-in leaderboard (`get_leaderboard` RPC,
  exposes only display names of users who've opted in).
- **Design system** (Phase 2): brand tokens in `src/app/globals.css` (single light palette, no
  dark mode yet), Inter font, rarity-tier color coding in `src/lib/design.ts`, a placeholder
  logo mark (`src/components/LogoMark.tsx`) pending the real exports (section 6 of the Phase 2
  brief), a species card grid + node-ring progress indicator on the Mining Hub.
- **AI Assistant** (`/api/assistant`, floating action button on every signed-in screen): calls
  the Google Gemini API (free tier — no billing card required, unlike Anthropic's API) grounded
  in `src/lib/assistant-context.ts` — keep that file current as the product changes. Requires
  `GEMINI_API_KEY` from [aistudio.google.com/apikey](https://aistudio.google.com/apikey);
  defaults to `gemini-2.5-flash`. Text-only, non-streaming, capped history/message length as a
  lightweight cost/quota guard — not real rate limiting. Free-tier limits change over time; check
  [ai.google.dev/pricing](https://ai.google.dev/pricing) if it starts erroring under load.

## Non-negotiables this scaffold follows (see the build prompt for the full list)

- The frontend is never trusted for balance/authorization decisions — every RPC re-derives state
  and checks `auth.uid()` itself, since `security definer` bypasses RLS.
- No claims of real donations, corporate partnerships, or monetary coin value anywhere in the UI.
- Pledges are explicitly symbolic and labeled as such; the Impact Fund page separates that from
  the developer's real donation log.

## Not yet built

- Real logo assets (`/public/logo/` at 512/192/32px) — currently a placeholder mark; swap
  `src/components/LogoMark.tsx` once exports are ready.
- Mobile (Expo) wrapper and `.apk` build — see Section 2 of the build prompt for the intended
  approach once the web app is stable.
- A less gameable mining contribution signal (currently a client-reported, server-clamped score —
  fine for a small friends-only trial, not for anything wider).
- Voice input/output for the assistant, ML-based contribution scoring, expanded species roster —
  explicitly deferred to Phase 3.
