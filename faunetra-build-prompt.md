# Faunetra — Build Prompt

Use this as the project brief when starting a Claude Code session (or any dev environment) to scaffold the app. Paste it in as-is, or trim sections as you go phase by phase.

---

## 1. Project Overview

Build **Faunetra**, a species-themed digital rewards app where users "mine" coins representing rare and endangered animals. It is a solo-developer, zero-budget project, built to be shared informally (APK link to friends, PWA in browser) before any app store publishing.

**Core concept:**
- Users sign in with Google.
- Users mine coins over time (contribution/reward based, not real CPU mining).
- Each coin type corresponds to a real animal species (e.g., Shark, Rhino, Butterfly), each with a defined rarity/scarcity cap.
- Users can send coins to friends (peer-to-peer transfer).
- Users can symbolically "pledge" coins toward a cause — this is NOT a real financial donation at this stage, and must be labeled honestly in the UI as symbolic/pledge-based, not "donate to X company."
- A public, transparent "Impact Fund" screen shows: total coins mined across all users → a formula → a real personal donation the developer makes periodically to a real conservation org (e.g., WWF). This must be described accurately as a founder-funded pledge, not a corporate partnership, until real app revenue exists.

**Explicitly NOT in scope for v1:**
- No real blockchain (defer to a much later phase, if ever).
- No real cryptocurrency, no claims of monetary value for coins.
- No claims of corporate donation partnerships (Google/Amazon/Apple/Zoho) — not credible at this stage and must not be implied anywhere in the app or copy.
- No ocean/pirate theme. Keep wallet/balance/transfer/transaction screens clean, neutral, and professional. Any playful visual theme (if added later) should be confined to non-financial screens only (onboarding, mining hub flavor text), not to money-representing UI.

---

## 2. Tech Stack

- **Frontend:** Next.js (React + TypeScript), deployed on Vercel (free tier)
- **Backend/DB/Auth:** Supabase (Postgres, Auth with Google OAuth, Row Level Security)
- **Money logic:** Postgres RPC functions (plpgsql) for all balance-changing operations — never direct client-side writes to balance columns
- **Scheduled jobs:** Supabase `pg_cron` (or Vercel Cron) for periodic mining reward settlement
- **Mobile distribution (early stage):** Expo (React Native) for a sideloadable `.apk` via `eas build -p android --profile preview`; iOS access via installable PWA (Add to Home Screen) since no Apple Developer account yet
- **Styling:** Clean, neutral, professional design system — no gaming/pirate aesthetic on core financial screens

---

## 3. Database Schema (Postgres / Supabase)

Implement these tables (adjust types/constraints as needed, but keep the ledger-based design — balances must be derived from transactions, not stored as a single mutable number that gets directly overwritten):

```sql
-- Users (Supabase Auth handles most of this; this is a profile extension table)
create table profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  created_at timestamptz default now()
);

-- Species / coin types
create table species (
  id uuid primary key default gen_random_uuid(),
  name text not null,              -- e.g. "Shark", "Rhino", "Butterfly"
  symbol text not null unique,     -- e.g. "SHK", "RHN", "BTF"
  total_supply numeric not null,   -- scarcity cap
  circulating_supply numeric not null default 0,
  rarity_tier text,                -- e.g. "common", "rare", "endangered", "critical"
  description text,
  learn_more_url text,             -- link to real conservation info about this species
  created_at timestamptz default now()
);

-- Wallets (one per user per species)
create table wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  species_id uuid not null references species(id),
  balance numeric not null default 0,  -- derived/reconciled from transactions; never write directly from client
  created_at timestamptz default now(),
  unique (user_id, species_id)
);

-- Immutable transaction ledger
create table transactions (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text unique,          -- prevents double-processing retried requests
  from_wallet_id uuid references wallets(id),  -- null for SYSTEM mint
  to_wallet_id uuid references wallets(id),    -- null for burns/pledges out of circulation
  species_id uuid not null references species(id),
  amount numeric not null check (amount > 0),
  type text not null,                   -- 'INITIAL_GRANT', 'MINING_REWARD', 'TRANSFER', 'PLEDGE'
  status text not null default 'CONFIRMED',
  created_at timestamptz default now()
);

-- Mining sessions
create table mining_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  species_id uuid not null references species(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  contribution_score numeric,
  reward_amount numeric,
  status text not null default 'ACTIVE'  -- 'ACTIVE', 'SETTLED'
);

-- Pledges (symbolic, not real donations)
create table pledges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  species_id uuid not null references species(id),
  amount numeric not null,
  cause_label text not null,   -- e.g. "Wildlife Conservation" — never a company name implying real transfer
  created_at timestamptz default now()
);

-- Impact fund tracking (developer's real personal donations)
create table impact_fund_log (
  id uuid primary key default gen_random_uuid(),
  total_coins_pledged_at_time numeric not null,
  amount_donated_inr numeric not null,
  recipient_org text not null,        -- real, verifiable org name
  receipt_url text,                   -- proof/receipt if available
  donated_at timestamptz default now(),
  note text
);
```

**Row Level Security requirements:**
- Users can `select` only their own `wallets`, `mining_sessions`, and `pledges` rows.
- Users can `select` all rows in `species` and `impact_fund_log` (public/read-only).
- No `insert`/`update`/`delete` permissions on `wallets` or `transactions` for the `authenticated` role directly — all changes must go through `security definer` RPC functions.

---

## 4. Core RPC Functions to Build

1. **`grant_initial_balance(user_id)`** — called once on signup. Mints a starting allocation from a SYSTEM treasury (respecting `total_supply` per species), creates the ledger entry, updates wallet balance atomically.
2. **`transfer_coins(from_user_id, to_user_id, species_id, amount, idempotency_key)`** — uses `SELECT ... FOR UPDATE` on both wallets, validates sufficient balance server-side (never trust client-sent balance), creates a `TRANSFER` transaction, updates both wallet balances atomically. Rejects if `idempotency_key` already used.
3. **`settle_mining_session(session_id)`** — computes reward using `Base Rate × Contribution Score × Time Factor × Network Factor`, checks against remaining `total_supply` for that species (never mint past the cap), creates a `MINING_REWARD` transaction, updates wallet balance.
4. **`pledge_coins(user_id, species_id, amount, cause_label)`** — deducts from user's wallet (coins leave circulation, or move to a symbolic "pledged" pool — decide and document which), creates a `PLEDGE` transaction and `pledges` row.

All of these should run as Postgres functions with `security definer`, callable via Supabase RPC from Next.js API routes (not directly from client components).

---

## 5. MVP Screens (build in this order)

1. **Login/Register** — Google OAuth via Supabase Auth (email/password fallback optional but recommended)
2. **Home/Wallet** — clean, neutral list of the user's species balances, total holdings
3. **Mining Hub** — start/stop a mining session, live contribution score, reward rate display
4. **Send/Receive** — transfer coins to another user by username/email
5. **Transaction History** — chronological ledger view, filterable by species/type
6. **Impact Fund** (public) — total coins mined platform-wide, developer's real donation log with receipts, clear labeling of what's symbolic vs. real
7. **Profile/Leaderboard** — user's species collection summary (e.g., "Shark – 10, Rhino – 260"), optional opt-in leaderboard

Build steps 1–3 as a working skeleton first (auth + wallet + one species) before expanding to the full species roster or adding polish.

---

## 6. Non-Negotiable Rules to Enforce Throughout

- **Never trust the frontend for balance or authorization decisions.** All spend/transfer logic re-derives balance from the ledger server-side.
- **Every money-moving operation must be atomic and idempotent** (row locking + idempotency keys).
- **No claims of real donations, corporate partnerships, or monetary coin value anywhere in the UI or copy** unless backed by an actual, documented, verifiable transaction.
- **Species data (rarity, descriptions) should link to real conservation information** where possible — this is what makes the theme meaningful rather than decorative.
- **Keep financial/wallet screens visually neutral and professional.** No gaming or thematic skin on money-representing UI.

---

## 7. First Task for the Coding Session

Start by scaffolding the Next.js + Supabase project structure, setting up Google OAuth, and implementing the schema + `grant_initial_balance` and `transfer_coins` RPC functions with a minimal test UI (just enough to sign in, see a balance, and send coins to another test user). Confirm this works end-to-end before moving on to the Mining Hub.
