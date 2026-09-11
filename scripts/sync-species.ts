/**
 * Species sync script — populates the `species` table from WoRMS + GBIF
 * (both free, no key) and, if an IUCN Red List API token is available,
 * the real conservation status from IUCN too.
 *
 * Run with: npm run sync:species
 *
 * Required env (put in .env.local — NEVER commit, NEVER paste in chat):
 *   NEXT_PUBLIC_SUPABASE_URL       — same as the app uses
 *   SUPABASE_SERVICE_ROLE_KEY      — Project Settings → API → service_role.
 *                                    This bypasses RLS; it's required here
 *                                    because `species` has no client insert
 *                                    policy (writes only happen through
 *                                    security definer RPCs or, for this
 *                                    one-time/periodic sync, the service
 *                                    role). Never expose this key to the
 *                                    browser or give it a NEXT_PUBLIC_ prefix.
 *
 * Optional env:
 *   IUCN_API_TOKEN                 — if set, real IUCN status is fetched
 *                                    per species. If unset, the curated
 *                                    FALLBACK_IUCN_CODE below is used
 *                                    instead, and every such row is flagged
 *                                    in source_note as needing verification
 *                                    — do not present those as authoritative
 *                                    in the product without checking
 *                                    redlist.org first.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IUCN_API_TOKEN = process.env.IUCN_API_TOKEN;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.\n" +
      "Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Project Settings → API → service_role) and re-run."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// IUCN Red List category code -> our rarity_tier value.
const CODE_TO_TIER: Record<string, string> = {
  LC: "Least Concern",
  NT: "Near Threatened",
  VU: "Vulnerable",
  EN: "Endangered",
  CR: "Critically Endangered",
};

const SUPPLY_BY_TIER: Record<string, { totalSupply: number; initialGrant: number }> = {
  "Least Concern": { totalSupply: 1_000_000, initialGrant: 10 },
  "Near Threatened": { totalSupply: 200_000, initialGrant: 5 },
  Vulnerable: { totalSupply: 50_000, initialGrant: 3 },
  Endangered: { totalSupply: 10_000, initialGrant: 2 },
  "Critically Endangered": { totalSupply: 1_000, initialGrant: 1 },
};

// Curated starter roster (~24 species) spanning all five tiers. Scientific
// names are used for the WoRMS/GBIF lookups; fallbackIucnCode is ONLY used
// when IUCN_API_TOKEN is not set, and is flagged as unverified in
// source_note — these are from general knowledge, not a live source, and
// IUCN reassessments do happen (e.g. some tuna stocks have been upgraded in
// recent years) — verify before treating as fact.
const CURATED_SPECIES: Array<{
  name: string;
  scientificName: string;
  symbol: string;
  fallbackIucnCode: keyof typeof CODE_TO_TIER;
  learnMoreUrl: string;
}> = [
  { name: "Green Sea Turtle", scientificName: "Chelonia mydas", symbol: "GST", fallbackIucnCode: "EN", learnMoreUrl: "https://www.iucnredlist.org/species/4615/11037468" },
  { name: "Hawksbill Turtle", scientificName: "Eretmochelys imbricata", symbol: "HBT", fallbackIucnCode: "CR", learnMoreUrl: "https://www.iucnredlist.org/species/8005/12881238" },
  { name: "Leatherback Turtle", scientificName: "Dermochelys coriacea", symbol: "LBT", fallbackIucnCode: "VU", learnMoreUrl: "https://www.iucnredlist.org/species/6494/43526147" },
  { name: "Loggerhead Turtle", scientificName: "Caretta caretta", symbol: "LGT", fallbackIucnCode: "VU", learnMoreUrl: "https://www.iucnredlist.org/species/3897/119333622" },
  { name: "Whale Shark", scientificName: "Rhincodon typus", symbol: "WHS", fallbackIucnCode: "EN", learnMoreUrl: "https://www.iucnredlist.org/species/19488/2365291" },
  { name: "Great White Shark", scientificName: "Carcharodon carcharias", symbol: "GWS", fallbackIucnCode: "VU", learnMoreUrl: "https://www.iucnredlist.org/species/3855/2878674" },
  { name: "Scalloped Hammerhead", scientificName: "Sphyrna lewini", symbol: "SHH", fallbackIucnCode: "CR", learnMoreUrl: "https://www.iucnredlist.org/species/39385/2918526" },
  { name: "Blacktip Reef Shark", scientificName: "Carcharhinus melanopterus", symbol: "BRS", fallbackIucnCode: "VU", learnMoreUrl: "https://www.iucnredlist.org/species/39375/58304583" },
  { name: "Giant Oceanic Manta Ray", scientificName: "Mobula birostris", symbol: "MNT", fallbackIucnCode: "EN", learnMoreUrl: "https://www.iucnredlist.org/species/198921/68632946" },
  { name: "Dugong", scientificName: "Dugong dugon", symbol: "DUG", fallbackIucnCode: "VU", learnMoreUrl: "https://www.iucnredlist.org/species/6909/160756767" },
  { name: "Sea Otter", scientificName: "Enhydra lutris", symbol: "OTR", fallbackIucnCode: "EN", learnMoreUrl: "https://www.iucnredlist.org/species/7750/21939518" },
  { name: "Steller Sea Lion", scientificName: "Eumetopias jubatus", symbol: "SSL", fallbackIucnCode: "NT", learnMoreUrl: "https://www.iucnredlist.org/species/8239/45225749" },
  { name: "Harbor Seal", scientificName: "Phoca vitulina", symbol: "HSL", fallbackIucnCode: "LC", learnMoreUrl: "https://www.iucnredlist.org/species/17013/45229114" },
  { name: "Blue Whale", scientificName: "Balaenoptera musculus", symbol: "BLW", fallbackIucnCode: "EN", learnMoreUrl: "https://www.iucnredlist.org/species/2477/156923585" },
  { name: "Humpback Whale", scientificName: "Megaptera novaeangliae", symbol: "HPW", fallbackIucnCode: "LC", learnMoreUrl: "https://www.iucnredlist.org/species/13006/50362794" },
  { name: "North Atlantic Right Whale", scientificName: "Eubalaena glacialis", symbol: "NAW", fallbackIucnCode: "CR", learnMoreUrl: "https://www.iucnredlist.org/species/41712/178589687" },
  { name: "Vaquita", scientificName: "Phocoena sinus", symbol: "VAQ", fallbackIucnCode: "CR", learnMoreUrl: "https://www.iucnredlist.org/species/17028/50370296" },
  { name: "Orca", scientificName: "Orcinus orca", symbol: "ORC", fallbackIucnCode: "NT", learnMoreUrl: "https://www.iucnredlist.org/species/15421/50368125" },
  { name: "Giant Pacific Octopus", scientificName: "Enteroctopus dofleini", symbol: "GPO", fallbackIucnCode: "LC", learnMoreUrl: "https://www.marinespecies.org/aphia.php?p=taxdetails&id=140905" },
  { name: "Chambered Nautilus", scientificName: "Nautilus pompilius", symbol: "NAU", fallbackIucnCode: "VU", learnMoreUrl: "https://www.iucnredlist.org/species/41485288/145768903" },
  { name: "Giant Clam", scientificName: "Tridacna gigas", symbol: "GCL", fallbackIucnCode: "VU", learnMoreUrl: "https://www.iucnredlist.org/species/22137/9362283" },
  { name: "Humphead Wrasse", scientificName: "Cheilinus undulatus", symbol: "HHW", fallbackIucnCode: "EN", learnMoreUrl: "https://www.iucnredlist.org/species/4592/97398790" },
  { name: "Staghorn Coral", scientificName: "Acropora cervicornis", symbol: "STC", fallbackIucnCode: "CR", learnMoreUrl: "https://www.iucnredlist.org/species/133381/3716457" },
  { name: "European Eel", scientificName: "Anguilla anguilla", symbol: "EEL", fallbackIucnCode: "CR", learnMoreUrl: "https://www.iucnredlist.org/species/60344/152845178" },
];

async function fetchWorms(scientificName: string) {
  try {
    const res = await fetch(
      `https://www.marinespecies.org/rest/AphiaRecordsByName/${encodeURIComponent(
        scientificName
      )}?like=false&marine_only=false`
    );
    if (!res.ok) return null;
    const records = (await res.json()) as Array<{ AphiaID: number; scientificname: string; status: string }>;
    const accepted = records.find((r) => r.status === "accepted") ?? records[0];
    return accepted ? { aphiaId: accepted.AphiaID } : null;
  } catch {
    return null;
  }
}

async function fetchGbif(scientificName: string) {
  try {
    const matchRes = await fetch(
      `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}`
    );
    if (!matchRes.ok) return null;
    const match = (await matchRes.json()) as { usageKey?: number };
    if (!match.usageKey) return null;

    let vernacularName: string | null = null;
    try {
      const vernacularRes = await fetch(
        `https://api.gbif.org/v1/species/${match.usageKey}/vernacularNames`
      );
      if (vernacularRes.ok) {
        const vernacular = (await vernacularRes.json()) as {
          results: Array<{ vernacularName: string; language: string }>;
        };
        vernacularName = vernacular.results.find((v) => v.language === "eng")?.vernacularName ?? null;
      }
    } catch {
      // Non-fatal — common name from our curated list is used instead.
    }

    return { gbifKey: match.usageKey, vernacularName };
  } catch {
    return null;
  }
}

async function fetchIucnCategory(scientificName: string): Promise<{ code: string; live: true } | null> {
  if (!IUCN_API_TOKEN) return null;
  try {
    const res = await fetch(
      `https://apiv3.iucnredlist.org/api/v3/species/${encodeURIComponent(scientificName)}?token=${IUCN_API_TOKEN}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: Array<{ category: string }> };
    const category = data.result?.[0]?.category;
    return category ? { code: category, live: true } : null;
  } catch {
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`Syncing ${CURATED_SPECIES.length} species${IUCN_API_TOKEN ? " (live IUCN lookups enabled)" : " (no IUCN_API_TOKEN — using curated fallback statuses)"}...\n`);

  for (const entry of CURATED_SPECIES) {
    process.stdout.write(`  ${entry.name} (${entry.scientificName})... `);

    const [worms, gbif, iucn] = await Promise.all([
      fetchWorms(entry.scientificName),
      fetchGbif(entry.scientificName),
      fetchIucnCategory(entry.scientificName),
    ]);

    const iucnCode = iucn?.code && CODE_TO_TIER[iucn.code] ? iucn.code : entry.fallbackIucnCode;
    const tier = CODE_TO_TIER[iucnCode] ?? "Least Concern";
    const supply = SUPPLY_BY_TIER[tier];
    const sourceNote = iucn
      ? "IUCN Red List API (live lookup)."
      : "Curated fallback status (no IUCN_API_TOKEN set) — verify against redlist.org before treating as authoritative.";

    const { error } = await supabase
      .from("species")
      .upsert(
        {
          name: gbif?.vernacularName ?? entry.name,
          symbol: entry.symbol,
          scientific_name: entry.scientificName,
          total_supply: supply.totalSupply,
          rarity_tier: tier,
          initial_grant_amount: supply.initialGrant,
          description: `${entry.name} (${entry.scientificName}) — IUCN status: ${tier}.`,
          learn_more_url: entry.learnMoreUrl,
          worms_aphia_id: worms?.aphiaId ?? null,
          gbif_key: gbif?.gbifKey ?? null,
          is_active: true,
          source_note: sourceNote,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "symbol" }
      );

    if (error) {
      console.log(`FAILED (${error.message})`);
    } else {
      console.log(`ok — WoRMS:${worms ? "y" : "n"} GBIF:${gbif ? "y" : "n"} tier:${tier}`);
    }

    // Be polite to the free public APIs.
    await sleep(300);
  }

  console.log("\nDone. Species marked is_active=true are now offered on the Mining Hub.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
