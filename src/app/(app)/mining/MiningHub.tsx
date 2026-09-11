"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Species } from "@/lib/types";
import { SpeciesCard } from "./SpeciesCard";
import { NodeRing } from "./NodeRing";

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
  const firstSelectable = species.find((s) => s.circulating_supply < s.total_supply);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(firstSelectable?.id ?? "");
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
    if (!selectedSpeciesId) return;
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

  if (session) {
    return (
      <div className="max-w-md">
        <div className="flex flex-col items-center rounded-lg border border-border bg-surface p-8">
          <div className="text-sm text-text-muted">Mining</div>
          <div className="text-lg font-semibold">
            {selectedSpecies?.name}
            {selectedSpecies?.scientific_name && (
              <span className="ml-1 text-sm font-normal italic text-text-muted">
                ({selectedSpecies.scientific_name})
              </span>
            )}
          </div>

          <div className="relative mt-6 flex items-center justify-center">
            <NodeRing value={contributionScore} max={MAX_CONTRIBUTION_SCORE} />
            <div className="absolute flex flex-col items-center">
              <div className="font-numeric text-2xl font-semibold tabular-nums">
                {formatDuration(elapsedMs)}
              </div>
              <div className="text-xs text-text-muted">elapsed</div>
            </div>
          </div>

          <div className="mt-6 grid w-full grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-text-muted">Contribution score</div>
              <div className="font-numeric font-medium tabular-nums">
                {contributionScore} / {MAX_CONTRIBUTION_SCORE}
              </div>
            </div>
            <div>
              <div className="text-text-muted">Estimated reward so far</div>
              <div className="font-numeric font-medium tabular-nums">
                {estimatedReward.toFixed(4)} {selectedSpecies?.symbol}
              </div>
            </div>
          </div>

          <button
            onClick={stopAndClaim}
            disabled={status.kind === "loading"}
            className="mt-6 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {status.kind === "loading" ? "Settling…" : "Stop & claim reward"}
          </button>
        </div>

        {status.kind === "error" && <p className="mt-4 text-sm text-error">{status.message}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {species.map((s) => (
          <SpeciesCard
            key={s.id}
            species={s}
            selected={s.id === selectedSpeciesId}
            onSelect={() => setSelectedSpeciesId(s.id)}
          />
        ))}
      </div>

      {species.length === 0 && (
        <p className="text-sm text-text-muted">No species available to mine right now.</p>
      )}

      <button
        onClick={startMining}
        disabled={status.kind === "loading" || !selectedSpeciesId}
        className="mt-6 w-full max-w-md rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {status.kind === "loading" ? "Starting…" : "Start mining"}
      </button>

      {status.kind === "error" && <p className="mt-4 text-sm text-error">{status.message}</p>}
    </div>
  );
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
