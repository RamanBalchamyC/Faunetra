-- Phase 3 update: replace the avatar picker with a country selector,
-- add per-user seen-question tracking so mining trivia stops repeating
-- within a normal session, and add a daily mining streak.

-- ---------------------------------------------------------------------------
-- Avatar -> country. avatar_id is dropped outright (and its check
-- constraint with it) per the brief — this app is for a global audience,
-- not tied to a fixed illustrated set.
-- ---------------------------------------------------------------------------

alter table profiles drop column if exists avatar_id;

alter table profiles add column if not exists country_code text;
alter table profiles drop constraint if exists profiles_country_code_check;
alter table profiles add constraint profiles_country_code_check
  check (country_code is null or country_code ~ '^[A-Z]{2}$');

-- ---------------------------------------------------------------------------
-- Mining streak. Maintained inside settle_mining_session (below) rather
-- than trusted from the client — it's derived purely from server-recorded
-- mining_sessions timestamps.
-- ---------------------------------------------------------------------------

alter table profiles
  add column if not exists current_streak integer not null default 0,
  add column if not exists longest_streak integer not null default 0,
  add column if not exists last_mined_date date;

-- ---------------------------------------------------------------------------
-- get_leaderboard / get_public_profile: avatar_id -> country_code.
-- ---------------------------------------------------------------------------

drop function if exists get_leaderboard();

create or replace function get_leaderboard()
returns table (user_id uuid, display_name text, country_code text, total_balance numeric)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, coalesce(p.display_name, 'Anonymous'), p.country_code, sum(w.balance) as total_balance
  from profiles p
  join wallets w on w.user_id = p.id
  where p.leaderboard_opt_in = true
  group by p.id, p.display_name, p.country_code
  order by total_balance desc
  limit 50;
$$;

grant execute on function get_leaderboard() to authenticated;

drop function if exists get_public_profile(uuid);

create or replace function get_public_profile(p_user_id uuid)
returns table (
  display_name text,
  country_code text,
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
  select p.display_name, p.country_code, s.name, s.symbol, s.rarity_tier, w.balance
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
-- mining_question_seen: append-only log of which trivia questions a user
-- has already been shown for a species, so the client can prioritize
-- unseen questions before repeating any (question content itself lives in
-- src/lib/species-trivia.ts, not the database — question_key is a stable
-- string id like "GST-0" the client controls).
-- ---------------------------------------------------------------------------

create table if not exists mining_question_seen (
  user_id uuid not null references profiles(id) on delete cascade,
  species_id uuid not null references species(id) on delete cascade,
  question_key text not null,
  seen_at timestamptz not null default now(),
  primary key (user_id, species_id, question_key)
);

alter table mining_question_seen enable row level security;

drop policy if exists mining_question_seen_select_own on mining_question_seen;
create policy mining_question_seen_select_own on mining_question_seen
  for select using (auth.uid() = user_id);

drop policy if exists mining_question_seen_insert_own on mining_question_seen;
create policy mining_question_seen_insert_own on mining_question_seen
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- settle_mining_session: unchanged reward logic, plus a streak update.
-- Streak increments once per calendar day (UTC) regardless of how many
-- mining rounds happen that day; resets to 1 if a day was missed.
-- ---------------------------------------------------------------------------

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
  v_today date := current_date;
  v_last_mined date;
  v_current_streak integer;
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

  -- Streak bookkeeping: one increment per calendar day, reset on a gap.
  select last_mined_date, current_streak into v_last_mined, v_current_streak
  from profiles where id = v_session.user_id for update;

  if v_last_mined is null or v_last_mined < v_today - 1 then
    v_current_streak := 1;
  elsif v_last_mined = v_today - 1 then
    v_current_streak := v_current_streak + 1;
  end if;
  -- v_last_mined = v_today: already counted today, leave streak unchanged.

  update profiles
  set last_mined_date = v_today,
      current_streak = v_current_streak,
      longest_streak = greatest(longest_streak, v_current_streak)
  where id = v_session.user_id;

  return v_reward;
end;
$$;

grant execute on function settle_mining_session(uuid, numeric) to authenticated;
