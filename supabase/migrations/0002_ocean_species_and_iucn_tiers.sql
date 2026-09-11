-- Phase 2: narrow to ocean species, adopt real IUCN Red List categories for
-- rarity_tier, and add metadata columns for the WoRMS/GBIF/IUCN sync script.
--
-- Safety note: this does NOT delete any existing species/wallets/transactions.
-- Two test accounts already have balances against the Phase 1 placeholder
-- species (Butterfly, Shark, Rhino, Amur Leopard) — deleting those rows would
-- cascade-break existing wallets/transactions that reference them via
-- foreign key. Instead:
--   * rarity_tier values are relabeled in place to the closest real IUCN
--     category (existing balances/history are untouched).
--   * non-marine placeholders (Butterfly, Rhino, Amur Leopard) are marked
--     is_active = false — hidden from new signups and species pickers, but
--     still fully visible to whoever already holds them (wallet/history
--     queries don't filter by is_active).
--   * Shark is kept active as a generic ocean placeholder until the sync
--     script (Section 2) adds properly named, individually-sourced shark
--     species — at which point this generic row can be retired too.

-- ---------------------------------------------------------------------------
-- New metadata columns for species sourced from WoRMS / GBIF / IUCN.
-- ---------------------------------------------------------------------------

alter table species
  add column if not exists scientific_name text,
  add column if not exists image_url text,
  add column if not exists worms_aphia_id integer,
  add column if not exists gbif_key integer,
  add column if not exists is_active boolean not null default true,
  add column if not exists source_note text,
  add column if not exists last_synced_at timestamptz;

comment on column species.source_note is
  'Free-text provenance/confidence note, e.g. flagging a conservation status as an unverified curated fallback (no IUCN API token) pending confirmation against the real IUCN listing.';

-- ---------------------------------------------------------------------------
-- Relabel rarity_tier to real IUCN Red List categories before tightening the
-- check constraint. Existing rows keep their relative rarity, just renamed.
-- ---------------------------------------------------------------------------

update species set rarity_tier = case rarity_tier
  when 'common' then 'Least Concern'
  when 'rare' then 'Near Threatened'
  when 'endangered' then 'Endangered'
  when 'critical' then 'Critically Endangered'
  else rarity_tier
end
where rarity_tier in ('common', 'rare', 'endangered', 'critical');

alter table species drop constraint if exists species_rarity_tier_check;
alter table species add constraint species_rarity_tier_check
  check (rarity_tier in ('Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered', 'Critically Endangered'));

-- Retire the non-marine placeholders from new signups / species pickers.
update species set is_active = false, source_note = 'Phase 1 placeholder, non-marine — retired when scope narrowed to ocean species. Existing holders are unaffected.'
where symbol in ('BTF', 'RHN', 'AML');

update species set source_note = 'Phase 1 generic placeholder pending replacement by named species from the WoRMS/GBIF/IUCN sync script.'
where symbol = 'SHK';

-- ---------------------------------------------------------------------------
-- grant_initial_balance: only mint starter wallets for active species. New
-- signups should never receive coins for retired placeholders.
-- ---------------------------------------------------------------------------

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
    where is_active = true
    for update
  loop
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
