import { requireUser } from "@/lib/auth";
import type { Species } from "@/lib/types";
import { MiningHub } from "./MiningHub";

export default async function MiningPage() {
  const { supabase } = await requireUser();

  const { data: species } = await supabase
    .from("species")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .returns<Species[]>();

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Mining Hub</h1>
      <p className="mt-1 max-w-md text-sm text-text-muted">
        Mining is contribution-based, not real computation — the reward comes from time spent and
        a contribution score, not your device&apos;s CPU.
      </p>
      <div className="mt-8">
        <MiningHub species={species ?? []} />
      </div>
    </div>
  );
}
