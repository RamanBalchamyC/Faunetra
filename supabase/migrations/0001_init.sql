-- Faunetra — initial schema, RLS, and money-moving RPC functions.
--
-- Design principles enforced throughout:
--   * Wallet balances are derived state, reconciled by ledger-writing RPCs only.
--     The `authenticated` role has NO insert/update/delete on wallets or
--     transactions — every balance change goes through a `security definer`
--     function that re-validates everything server-side.
--   * Every security definer function that acts "as" a specific user checks
--     `auth.uid()` itself — security definer bypasses RLS, so the function
--     body is the only remaining authorization boundary.
--   * Row locks (`for update`) + a unique `idempotency_key` make transfers and
--     settlements safe to retry.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  leaderboard_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

create table species (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  symbol text not null unique,
  total_supply numeric not null check (total_supply > 0),
  circulating_supply numeric not null default 0 check (circulating_supply >= 0),
  rarity_tier text not null check (rarity_tier in ('common', 'rare', 'endangered', 'critical')),
  -- One-time starter grant minted per new user for this species (see
  -- grant_initial_balance). Tunable per species so rarer species hand out
  -- fewer starter coins.
  initial_grant_amount numeric not null default 1 check (initial_grant_amount >= 0),
  description text,
  learn_more_url text,
  created_at timestamptz not null default now(),
  constraint circulating_supply_within_cap check (circulating_supply <= total_supply)
);

create table wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  species_id uuid not null references species(id),
  balance numeric not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, species_id)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text unique,
  from_wallet_id uuid references wallets(id),
  to_wallet_id uuid references wallets(id),
  species_id uuid not null references species(id),
  amount numeric not null check (amount > 0),
  type text not null check (type in ('INITIAL_GRANT', 'MINING_REWARD', 'TRANSFER', 'PLEDGE')),
  status text not null default 'CONFIRMED' check (status in ('CONFIRMED', 'FAILED')),
  created_at timestamptz not null default now(),
  constraint from_or_to_present check (from_wallet_id is not null or to_wallet_id is not null)
);

create index transactions_from_wallet_idx on transactions(from_wallet_id);
create index transactions_to_wallet_idx on transactions(to_wallet_id);

create table mining_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  species_id uuid not null references species(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  contribution_score numeric,
  reward_amount numeric,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SETTLED'))
);

create index mining_sessions_user_idx on mining_sessions(user_id);

create table pledges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  species_id uuid not null references species(id),
  amount numeric not null check (amount > 0),
  cause_label text not null,
  created_at timestamptz not null default now()
);

create table impact_fund_log (
  id uuid primary key default gen_random_uuid(),
  total_coins_pledged_at_time numeric not null,
  amount_donated_inr numeric not null,
  recipient_org text not null,
  receipt_url text,
  donated_at timestamptz not null default now(),
  note text
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table species enable row level security;
alter table wallets enable row level security;
alter table transactions enable row level security;
alter table mining_sessions enable row level security;
alter table pledges enable row level security;
alter table impact_fund_log enable row level security;

-- profiles: a user can read/update only their own row. Email is never
-- exposed to other users directly — cross-user lookup goes through the
-- find_user_by_email() RPC below, which returns a bare id or null.
create policy profiles_select_own on profiles
  for select using (auth.uid() = id);

create policy profiles_update_own on profiles
  for update using (auth.uid() = id);

-- A read-only public view of just (id, display_name), safe to expose for
-- things like transaction history and leaderboards without leaking email.
create view public_profiles as
  select id, display_name from profiles;

grant select on public_profiles to authenticated;

-- species: public, read-only reference data.
create policy species_select_all on species
  for select using (true);

-- wallets: users see only their own wallets. No insert/update/delete for
-- `authenticated` — all mutation happens inside security definer RPCs.
create policy wallets_select_own on wallets
  for select using (auth.uid() = user_id);

-- transactions: visible to either party of the transaction.
create policy transactions_select_own on transactions
  for select using (
    exists (select 1 from wallets w where w.id = transactions.from_wallet_id and w.user_id = auth.uid())
    or exists (select 1 from wallets w where w.id = transactions.to_wallet_id and w.user_id = auth.uid())
  );

-- mining_sessions: users see only their own sessions.
create policy mining_sessions_select_own on mining_sessions
  for select using (auth.uid() = user_id);

-- pledges: a user's own pledges are private detail rows; the public Impact
-- Fund screen is powered by aggregates + impact_fund_log, not this table.
create policy pledges_select_own on pledges
  for select using (auth.uid() = user_id);

-- impact_fund_log: public, read-only — this is the transparency screen.
create policy impact_fund_log_select_all on impact_fund_log
  for select using (true);

-- Explicitly no insert/update/delete policies for `authenticated` on
-- wallets, transactions, mining_sessions, pledges, or impact_fund_log:
-- with RLS enabled and no matching policy, those statements are denied by
-- default. All writes happen via the security definer functions below.

-- ---------------------------------------------------------------------------
-- RPC functions
-- ---------------------------------------------------------------------------

-- grant_initial_balance(user_id)
--   Mints each species' starter allocation into a fresh wallet for a
--   newly-created user. Called automatically by the handle_new_user trigger
--   below (never directly by the client) — it is not authorization-checked
--   against auth.uid() because it never runs in a user session context.
create or replace function grant_initial_balance(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_species record;
  v_wallet_id uuid;
  v_grant numeric;
begin
  for v_species in
    select id, total_supply, circulating_supply, initial_grant_amount
    from species
    for update
  loop
    -- Never mint past the scarcity cap; clamp the grant to whatever
    -- headroom remains (which may be zero).
    v_grant := least(v_species.initial_grant_amount, v_species.total_supply - v_species.circulating_supply);

    insert into wallets (user_id, species_id, balance)
    values (p_user_id, v_species.id, 0)
    on conflict (user_id, species_id) do nothing
    returning id into v_wallet_id;

    if v_wallet_id is null then
      select id into v_wallet_id from wallets
      where user_id = p_user_id and species_id = v_species.id;
    end if;

    if v_grant > 0 then
      insert into transactions (from_wallet_id, to_wallet_id, species_id, amount, type)
      values (null, v_wallet_id, v_species.id, v_grant, 'INITIAL_GRANT');

      update wallets set balance = balance + v_grant where id = v_wallet_id;
      update species set circulating_supply = circulating_supply + v_grant where id = v_species.id;
    end if;
  end loop;
end;
$$;

-- find_user_by_email(email)
--   The only cross-user lookup exposed to clients: resolves an email to a
--   user id for the Send flow, without exposing any other profile/email data.
create or replace function find_user_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from profiles where email = lower(p_email);
$$;

grant execute on function find_user_by_email(text) to authenticated;

-- start_mining_session(species_id)
--   Creates the ACTIVE session row server-side (started_at = now(), never a
--   client-supplied timestamp). One active session per user at a time.
create or replace function start_mining_session(p_species_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if exists (select 1 from mining_sessions where user_id = v_user_id and status = 'ACTIVE') then
    raise exception 'you already have an active mining session';
  end if;

  if not exists (select 1 from species where id = p_species_id) then
    raise exception 'unknown species';
  end if;

  insert into mining_sessions (user_id, species_id)
  values (v_user_id, p_species_id)
  returning id into v_session_id;

  return v_session_id;
end;
$$;

grant execute on function start_mining_session(uuid) to authenticated;

-- transfer_coins(from_user_id, to_user_id, species_id, amount, idempotency_key)
--   Peer-to-peer transfer. Locks both wallets in a fixed order (by wallet id)
--   to avoid deadlocks between concurrent opposite-direction transfers.
create or replace function transfer_coins(
  p_from_user_id uuid,
  p_to_user_id uuid,
  p_species_id uuid,
  p_amount numeric,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_wallet wallets%rowtype;
  v_to_wallet wallets%rowtype;
  v_from_id uuid;
  v_to_id uuid;
  v_existing_tx_id uuid;
  v_new_tx_id uuid;
begin
  if auth.uid() is distinct from p_from_user_id then
    raise exception 'not authorized to transfer from this account';
  end if;

  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  if p_from_user_id = p_to_user_id then
    raise exception 'cannot transfer to yourself';
  end if;

  -- Idempotency: if this key was already processed, return the prior result
  -- instead of erroring or double-spending on a client retry.
  if p_idempotency_key is not null then
    select id into v_existing_tx_id from transactions where idempotency_key = p_idempotency_key;
    if v_existing_tx_id is not null then
      return v_existing_tx_id;
    end if;
  end if;

  select id into v_from_id from wallets where user_id = p_from_user_id and species_id = p_species_id;
  select id into v_to_id from wallets where user_id = p_to_user_id and species_id = p_species_id;

  if v_from_id is null then
    raise exception 'sender has no wallet for this species';
  end if;
  if v_to_id is null then
    raise exception 'recipient has no wallet for this species';
  end if;

  -- Lock in a stable order (by id) regardless of sender/recipient to avoid
  -- deadlocking with a concurrent transfer running in the opposite direction.
  if v_from_id < v_to_id then
    select * into v_from_wallet from wallets where id = v_from_id for update;
    select * into v_to_wallet from wallets where id = v_to_id for update;
  else
    select * into v_to_wallet from wallets where id = v_to_id for update;
    select * into v_from_wallet from wallets where id = v_from_id for update;
  end if;

  if v_from_wallet.balance < p_amount then
    raise exception 'insufficient balance';
  end if;

  insert into transactions (idempotency_key, from_wallet_id, to_wallet_id, species_id, amount, type)
  values (p_idempotency_key, v_from_wallet.id, v_to_wallet.id, p_species_id, p_amount, 'TRANSFER')
  returning id into v_new_tx_id;

  update wallets set balance = balance - p_amount where id = v_from_wallet.id;
  update wallets set balance = balance + p_amount where id = v_to_wallet.id;

  return v_new_tx_id;
exception
  when unique_violation then
    -- Concurrent retry raced us on the idempotency key; return the row the
    -- other call created.
    select id into v_existing_tx_id from transactions where idempotency_key = p_idempotency_key;
    return v_existing_tx_id;
end;
$$;

grant execute on function transfer_coins(uuid, uuid, uuid, numeric, text) to authenticated;

-- settle_mining_session(session_id, contribution_score)
--   Ends an ACTIVE session and mints its reward. reward = base_rate *
--   contribution_score * time_factor * network_factor. time_factor is hours
--   elapsed (computed from the server-recorded started_at, never trusted
--   from the client); network_factor is a placeholder fixed at 1 until
--   there's a real notion of network-wide mining load to normalize against.
--   The reward is clamped to whatever supply headroom remains for the
--   species — it never mints past total_supply.
--
--   contribution_score IS client-reported (the "live contribution score" UI
--   needs some signal to show), so it is clamped to a small max here as a
--   soft anti-abuse guard. This is intentionally not a full anti-cheat
--   design — acceptable for a zero-budget v1 shared informally with
--   friends, but should be revisited (e.g. server-computed engagement
--   heartbeats) before any wider or incentivized rollout.
create or replace function settle_mining_session(
  p_session_id uuid,
  p_contribution_score numeric
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session mining_sessions%rowtype;
  v_species record;
  v_wallet_id uuid;
  v_base_rate numeric := 1;
  v_network_factor numeric := 1;
  v_max_contribution_score numeric := 10;
  v_contribution_score numeric;
  v_time_factor numeric;
  v_reward numeric;
begin
  select * into v_session from mining_sessions where id = p_session_id for update;

  if v_session.id is null then
    raise exception 'mining session not found';
  end if;
  if auth.uid() is distinct from v_session.user_id then
    raise exception 'not authorized to settle this session';
  end if;
  if v_session.status <> 'ACTIVE' then
    raise exception 'session is not active';
  end if;
  if p_contribution_score < 0 then
    raise exception 'contribution score must be non-negative';
  end if;

  v_contribution_score := least(p_contribution_score, v_max_contribution_score);

  select id, total_supply, circulating_supply into v_species
  from species where id = v_session.species_id for update;

  v_time_factor := greatest(extract(epoch from (now() - v_session.started_at)) / 3600.0, 0);
  v_reward := v_base_rate * v_contribution_score * v_time_factor * v_network_factor;
  v_reward := least(v_reward, v_species.total_supply - v_species.circulating_supply);
  v_reward := greatest(v_reward, 0);

  update mining_sessions
  set ended_at = now(),
      contribution_score = v_contribution_score,
      reward_amount = v_reward,
      status = 'SETTLED'
  where id = p_session_id;

  if v_reward > 0 then
    select id into v_wallet_id from wallets
    where user_id = v_session.user_id and species_id = v_session.species_id;

    if v_wallet_id is null then
      insert into wallets (user_id, species_id, balance)
      values (v_session.user_id, v_session.species_id, 0)
      returning id into v_wallet_id;
    end if;

    insert into transactions (from_wallet_id, to_wallet_id, species_id, amount, type)
    values (null, v_wallet_id, v_session.species_id, v_reward, 'MINING_REWARD');

    update wallets set balance = balance + v_reward where id = v_wallet_id;
    update species set circulating_supply = circulating_supply + v_reward where id = v_species.id;
  end if;

  return v_reward;
end;
$$;

grant execute on function settle_mining_session(uuid, numeric) to authenticated;

-- pledge_coins(user_id, species_id, amount, cause_label)
--   Symbolic pledge: coins are deducted from the user's wallet and retired
--   (to_wallet_id = null), NOT sent to any real organization or account.
--   circulating_supply is intentionally left unchanged — it tracks total
--   ever minted (the scarcity cap consumed), not current holdings, so a
--   pledge can never "free up" mintable supply. This is a symbolic pledge
--   only; no real money moves. See impact_fund_log for the developer's
--   actual, separately-tracked personal donations.
create or replace function pledge_coins(
  p_user_id uuid,
  p_species_id uuid,
  p_amount numeric,
  p_cause_label text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet wallets%rowtype;
  v_tx_id uuid;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'not authorized to pledge from this account';
  end if;
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  if p_cause_label is null or length(trim(p_cause_label)) = 0 then
    raise exception 'cause_label is required';
  end if;

  select * into v_wallet from wallets
  where user_id = p_user_id and species_id = p_species_id
  for update;

  if v_wallet.id is null then
    raise exception 'no wallet for this species';
  end if;
  if v_wallet.balance < p_amount then
    raise exception 'insufficient balance';
  end if;

  insert into transactions (from_wallet_id, to_wallet_id, species_id, amount, type)
  values (v_wallet.id, null, p_species_id, p_amount, 'PLEDGE')
  returning id into v_tx_id;

  update wallets set balance = balance - p_amount where id = v_wallet.id;

  insert into pledges (user_id, species_id, amount, cause_label)
  values (p_user_id, p_species_id, p_amount, p_cause_label);

  return v_tx_id;
end;
$$;

grant execute on function pledge_coins(uuid, uuid, numeric, text) to authenticated;

-- get_leaderboard()
--   Aggregate total holdings (summed across all species) for users who have
--   opted in via profiles.leaderboard_opt_in. Returns display_name only —
--   never id or email — since wallets/profiles RLS otherwise keeps every
--   user's holdings private to themselves.
create or replace function get_leaderboard()
returns table (display_name text, total_balance numeric)
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(p.display_name, 'Anonymous'), sum(w.balance) as total_balance
  from profiles p
  join wallets w on w.user_id = p.id
  where p.leaderboard_opt_in = true
  group by p.id, p.display_name
  order by total_balance desc
  limit 20;
$$;

grant execute on function get_leaderboard() to authenticated;

-- ---------------------------------------------------------------------------
-- New-user bootstrap: create the profile row and mint the starter wallets
-- the moment Supabase Auth creates the underlying auth.users row (Google
-- OAuth or otherwise). Runs as the trigger owner, not in a user session, so
-- it is exempt from — and must not rely on — auth.uid().
-- ---------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, display_name)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  perform grant_initial_balance(new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
