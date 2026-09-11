-- Phase 3: theme preference + avatar on profiles, a safe public-profile RPC
-- for the leaderboard's tap-through view, and a daily attempt cap on
-- mining sessions to support the trivia-based mining flow.

-- ---------------------------------------------------------------------------
-- Profile additions. Reuses the existing `leaderboard_opt_in` column from
-- Phase 1 rather than adding a duplicately-named `show_on_leaderboard` —
-- kept as opt-in (default false) rather than the opt-out (default true)
-- suggested in the Phase 3 brief, since the very first build prompt called
-- for an "optional opt-in leaderboard" — opt-in is the more private default
-- and nothing since has asked to reverse that.
-- ---------------------------------------------------------------------------

alter table profiles
  add column if not exists avatar_id text not null default 'octopus',
  add column if not exists theme_preference text not null default 'system';

alter table profiles drop constraint if exists profiles_theme_preference_check;
alter table profiles add constraint profiles_theme_preference_check
  check (theme_preference in ('light', 'dark', 'system'));

alter table profiles drop constraint if exists profiles_avatar_id_check;
alter table profiles add constraint profiles_avatar_id_check
  check (avatar_id in ('octopus', 'turtle', 'seahorse', 'fish', 'crab', 'shrimp', 'jellyfish', 'starfish', 'seal'));

-- profiles_update_own (from 0001) already covers these new columns — it has
-- no per-column restriction, and USING-without-WITH-CHECK on an UPDATE
-- policy reuses the USING clause as the check, so no RLS change needed.

-- ---------------------------------------------------------------------------
-- get_leaderboard: extended to return id + avatar_id so each row can link
-- to a public profile view.
-- ---------------------------------------------------------------------------

drop function if exists get_leaderboard();

create or replace function get_leaderboard()
returns table (user_id uuid, display_name text, avatar_id text, total_balance numeric)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, coalesce(p.display_name, 'Anonymous'), p.avatar_id, sum(w.balance) as total_balance
  from profiles p
  join wallets w on w.user_id = p.id
  where p.leaderboard_opt_in = true
  group by p.id, p.display_name, p.avatar_id
  order by total_balance desc
  limit 50;
$$;

grant execute on function get_leaderboard() to authenticated;

-- ---------------------------------------------------------------------------
-- get_public_profile: the ONLY way to see another user's collection. Checks
-- leaderboard_opt_in itself and returns nothing for opted-out users, rather
-- than relaxing RLS on wallets/profiles directly (which would let any
-- authenticated user read everyone's full wallet/profile rows).
-- ---------------------------------------------------------------------------

create or replace function get_public_profile(p_user_id uuid)
returns table (
  display_name text,
  avatar_id text,
  species_name text,
  species_symbol text,
  rarity_tier text,
  balance numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select p.display_name, p.avatar_id, s.name, s.symbol, s.rarity_tier, w.balance
  from profiles p
  join wallets w on w.user_id = p.id
  join species s on s.id = w.species_id
  where p.id = p_user_id
    and p.leaderboard_opt_in = true
    and w.balance > 0
  order by w.balance desc;
$$;

grant execute on function get_public_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- start_mining_session: add a daily attempt cap per user+species, to
-- support the trivia-based "bounded active engagement" mining model
-- instead of unbounded idle accrual. Everything else about the function is
-- unchanged from 0001.
-- ---------------------------------------------------------------------------

create or replace function start_mining_session(p_species_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
  v_attempts_today integer;
  v_daily_limit constant integer := 5;
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

  select count(*) into v_attempts_today
  from mining_sessions
  where user_id = v_user_id
    and species_id = p_species_id
    and started_at >= date_trunc('day', now());

  if v_attempts_today >= v_daily_limit then
    raise exception 'daily mining attempt limit reached for this species — come back tomorrow';
  end if;

  insert into mining_sessions (user_id, species_id)
  values (v_user_id, p_species_id)
  returning id into v_session_id;

  return v_session_id;
end;
$$;

grant execute on function start_mining_session(uuid) to authenticated;
