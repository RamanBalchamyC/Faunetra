"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Species } from "@/lib/types";

type ActiveSession = { id: string; speciesId: string; startedAt: number };

const BASE_RATE = 1;
const MAX_CONTRIBUTION_SCORE = 10;
// Contribution score climbs by 1 every 30s the tab stays open on this page,
// capped server-side too — see settle_mining_session in the migration for
// why this is a placeholder, not a real anti-cheat design.
const SCORE_INCREMENT_MS = 30_000;

export function MiningHub({ species }: { species: Species[] }) {
  const router = useRouter();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(species[0]?.id ?? "");
  const [now, setNow] = useState(() => Date.now());
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "error"; message?: string }>({
    kind: "idle",
  });

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [session]);

  const elapsedMs = session ? now - session.startedAt : 0;
  const contributionScore = session
    ? Math.min(Math.floor(elapsedMs / SCORE_INCREMENT_MS) + 1, MAX_CONTRIBUTION_SCORE)
    : 0;
  const hoursElapsed = elapsedMs / (1000 * 60 * 60);
  const estimatedReward = useMemo(
    () => BASE_RATE * contributionScore * hoursElapsed,
    [contributionScore, hoursElapsed]
  );

  async function startMining() {
    setStatus({ kind: "loading" });
    const supabase = createClient();
    const { data, error } = await supabase.rpc("start_mining_session", {
      p_species_id: selectedSpeciesId,
    });
    if (error) {
      setStatus({ kind: "error", message: error.message });
      return;
    }
    setSession({ id: data as string, speciesId: selectedSpeciesId, startedAt: Date.now() });
    setStatus({ kind: "idle" });
  }

  async function stopAndClaim() {
    if (!session) return;
    setStatus({ kind: "loading" });
    const supabase = createClient();
    const { error } = await supabase.rpc("settle_mining_session", {
      p_session_id: session.id,
      p_contribution_score: contributionScore,
    });
    if (error) {
      setStatus({ kind: "error", message: error.message });
      return;
    }
    setSession(null);
    setStatus({ kind: "idle" });
    router.refresh();
  }

  const selectedSpecies = species.find((s) => s.id === (session?.speciesId ?? selectedSpeciesId));

  return (
    <div className="max-w-md">
      {!session ? (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Species to mine
            </label>
            <select
              value={selectedSpeciesId}
              onChange={(e) => setSelectedSpeciesId(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              {species.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.symbol}) · {s.rarity_tier}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={startMining}
            disabled={status.kind === "loading" || !selectedSpeciesId}
            className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
          >
            {status.kind === "loading" ? "Starting…" : "Start mining"}
          </button>
        </div>
      ) : (
        <div className="space-y-5 rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
          <div>
            <div className="text-sm text-neutral-500">Mining</div>
            <div className="text-lg font-semibold">
              {selectedSpecies?.name} ({selectedSpecies?.symbol})
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-neutral-500">Elapsed</div>
              <div className="font-medium tabular-nums">{formatDuration(elapsedMs)}</div>
            </div>
            <div>
              <div className="text-neutral-500">Contribution score</div>
              <div className="font-medium tabular-nums">
                {contributionScore} / {MAX_CONTRIBUTION_SCORE}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-neutral-500">Estimated reward so far</div>
              <div className="font-medium tabular-nums">
                {estimatedReward.toFixed(4)} {selectedSpecies?.symbol}
              </div>
            </div>
          </div>
          <button
            onClick={stopAndClaim}
            disabled={status.kind === "loading"}
            className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
          >
            {status.kind === "loading" ? "Settling…" : "Stop & claim reward"}
          </button>
        </div>
      )}

      {status.kind === "error" && <p className="mt-4 text-sm text-red-600">{status.message}</p>}
    </div>
  );
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
