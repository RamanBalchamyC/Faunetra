// One-off verification: confirms the live Supabase project actually has
// what the Expo migration prompt claims, using the service role key
// (bypasses RLS) rather than trusting migration files alone.
//
//   node --env-file=.env.local scripts/verify-schema.mjs
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
let allOk = true;

function report(label, ok, detail = "") {
  console.log(`${ok ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`);
  if (!ok) allOk = false;
}

// Tables + row counts
for (const table of [
  "profiles", "species", "wallets", "transactions",
  "mining_sessions", "pledges", "impact_fund_log", "mining_question_seen",
]) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  report(`table "${table}" exists`, !error, error ? error.message : `${count} rows`);
}

// Profile columns from Phase 3 work — select each explicitly; an unknown
// column errors immediately via PostgREST.
const { error: profileColsError } = await supabase
  .from("profiles")
  .select("theme_preference, country_code, leaderboard_opt_in, current_streak, longest_streak, last_mined_date")
  .limit(1);
report("profiles has theme_preference/country_code/leaderboard_opt_in/streak columns", !profileColsError, profileColsError?.message);

// RPC functions — calling with a bogus/harmless argument still proves the
// function exists (a missing function errors distinctly from a bad-arg error).
const rpcChecks = [
  ["find_user_by_email", { p_email: "nonexistent@example.invalid" }],
  ["get_leaderboard", {}],
  ["get_public_profile", { p_user_id: "00000000-0000-0000-0000-000000000000" }],
];
for (const [name, args] of rpcChecks) {
  const { error } = await supabase.rpc(name, args);
  const missing = error?.message?.includes("Could not find the function");
  report(`RPC "${name}" exists`, !missing, error && missing ? error.message : "callable");
}

console.log(allOk ? "\nAll checks passed." : "\nSome checks failed — see above.");
process.exit(allOk ? 0 : 1);
