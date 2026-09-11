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

(If you have the Supabase CLI linked to the project instead, `supabase db push` +
`supabase db execute -f supabase/seed.sql` do the same thing.)

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
  `src/middleware.ts` refreshing sessions and gating every route except `/login`,
  `/auth/callback`, and the public `/impact` page.
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

## Non-negotiables this scaffold follows (see the build prompt for the full list)

- The frontend is never trusted for balance/authorization decisions — every RPC re-derives state
  and checks `auth.uid()` itself, since `security definer` bypasses RLS.
- No claims of real donations, corporate partnerships, or monetary coin value anywhere in the UI.
- Pledges are explicitly symbolic and labeled as such; the Impact Fund page separates that from
  the developer's real donation log.

## Not yet built

- Full species roster / richer species detail pages.
- Mobile (Expo) wrapper and `.apk` build — see Section 2 of the build prompt for the intended
  approach once the web app is stable.
- A less gameable mining contribution signal (currently a client-reported, server-clamped score —
  fine for a small friends-only trial, not for anything wider).
