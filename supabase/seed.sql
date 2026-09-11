-- Phase 1 starter roster. Superseded by Phase 2's ocean-only scope — see
-- supabase/migrations/0002_ocean_species_and_iucn_tiers.sql and the
-- species sync script (scripts/sync-species.ts). Kept here only so a fresh
-- project bootstraps with *something* before the sync script has run;
-- non-marine entries are seeded already inactive.
insert into species (name, symbol, total_supply, rarity_tier, initial_grant_amount, description, learn_more_url, is_active)
values
  ('Butterfly', 'BTF', 1000000, 'Least Concern',        10, 'A stand-in for common, widespread pollinator species. Not a marine species — inactive.', 'https://www.worldwildlife.org/species/monarch-butterfly', false),
  ('Shark',     'SHK', 200000,  'Vulnerable',            5, 'Generic placeholder — replace with named species from the sync script. Many shark species are threatened by overfishing and bycatch.', 'https://www.worldwildlife.org/species/shark', true),
  ('Rhino',     'RHN', 20000,   'Endangered',            2, 'All five rhino species are threatened, several critically. Not a marine species — inactive.', 'https://www.worldwildlife.org/species/rhino', false),
  ('Amur Leopard', 'AML', 2000, 'Critically Endangered', 1, 'Fewer than 100 Amur leopards remain in the wild. Not a marine species — inactive.', 'https://www.worldwildlife.org/species/amur-leopard', false)
on conflict (symbol) do nothing;
