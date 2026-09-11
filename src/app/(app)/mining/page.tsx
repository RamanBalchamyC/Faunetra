import { requireUser } from "@/lib/auth";
import type { Species } from "@/lib/types";
import { MiningHub } from "./MiningHub";

export default async function MiningPage() {
  const { supabase, user } = await requireUser();

  const { data: species } = await supabase
    .from("species")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .returns<Species[]>();

  // Attempts used today, per species — mirrors the daily cap enforced
  // server-side in start_mining_session (0003 migration). Timezone is
  // approximate (JS "start of day" vs Postgres date_trunc('day', now())
  // in UTC) — a cosmetic mismatch at worst, since the RPC is the real
  // enforcement point.
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { data: todaysSessions } = await supabase
    .from("mining_sessions")
    .select("species_id")
    .eq("user_id", user.id)
    .gte("started_at", startOfDay.toISOString());

  const attemptsUsedToday: Record<string, number> = {};
  for (const row of todaysSessions ?? []) {
    attemptsUsedToday[row.species_id] = (attemptsUsedToday[row.species_id] ?? 0) + 1;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Mining Hub</h1>
      <p className="mt-1 max-w-md text-sm text-text-muted">
        Answer a short round of real conservation trivia about a species to discover coins — a few
        genuine rounds a day, not idle waiting.
      </p>
      <div className="mt-8">
        <MiningHub species={species ?? []} attemptsUsedToday={attemptsUsedToday} />
      </div>
    </div>
  );
}
