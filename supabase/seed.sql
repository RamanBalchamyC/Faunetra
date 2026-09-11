-- Starter species roster. Real conservation status/links — keep these
-- honest and update learn_more_url with sources you've actually checked.
insert into species (name, symbol, total_supply, rarity_tier, initial_grant_amount, description, learn_more_url)
values
  ('Butterfly', 'BTF', 1000000, 'common',     10, 'A stand-in for common, widespread pollinator species.', 'https://www.worldwildlife.org/species/monarch-butterfly'),
  ('Shark',     'SHK', 200000,  'rare',        5, 'Many shark species are threatened by overfishing and bycatch.', 'https://www.worldwildlife.org/species/shark'),
  ('Rhino',     'RHN', 20000,   'endangered',  2, 'All five rhino species are threatened, several critically.', 'https://www.worldwildlife.org/species/rhino'),
  ('Amur Leopard', 'AML', 2000, 'critical',    1, 'Fewer than 100 Amur leopards remain in the wild.', 'https://www.worldwildlife.org/species/amur-leopard')
on conflict (symbol) do nothing;
