"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Species } from "@/lib/types";
import { getTriviaForSpecies } from "@/lib/species-trivia";
import { SpeciesCard } from "./SpeciesCard";
import { TriviaRound } from "./TriviaRound";
import { NodeRing } from "./NodeRing";

const DAILY_LIMIT = 5;
const QUESTIONS_PER_ROUND = 3;

type Stage =
  | { kind: "picking" }
  | { kind: "trivia"; sessionId: string; species: Species }
  | { kind: "result"; species: Species; correctCount: number; reward: number };

export function MiningHub({
  species,
  attemptsUsedToday,
}: {
  species: Species[];
  attemptsUsedToday: Record<string, number>;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: "picking" });
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(
    species.find((s) => s.total_supply > s.circulating_supply && (attemptsUsedToday[s.id] ?? 0) < DAILY_LIMIT)?.id ?? ""
  );
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "error"; message?: string }>({
    kind: "idle",
  });

  async function startDiscovery() {
    const selected = species.find((s) => s.id === selectedSpeciesId);
    if (!selected) return;
    setStatus({ kind: "loading" });

    const supabase = createClient();
    const { data: sessionId, error } = await supabase.rpc("start_mining_session", {
      p_species_id: selected.id,
    });
    if (error) {
      setStatus({ kind: "error", message: error.message });
      return;
    }
    setStatus({ kind: "idle" });
    setStage({ kind: "trivia", sessionId: sessionId as string, species: selected });
  }

  async function handleTriviaComplete(sessionId: string, targetSpecies: Species, correctCount: number) {
    setStatus({ kind: "loading" });
    const supabase = createClient();
    const { data: reward, error } = await supabase.rpc("settle_mining_session", {
      p_session_id: sessionId,
      p_contribution_score: correctCount,
    });
    setStatus({ kind: "idle" });

    if (error) {
      setStatus({ kind: "error", message: error.message });
      setStage({ kind: "picking" });
      return;
    }

    setStage({ kind: "result", species: targetSpecies, correctCount, reward: (reward as number) ?? 0 });
    router.refresh();
  }

  if (stage.kind === "trivia") {
    return (
      <TriviaRound
        questions={getTriviaForSpecies(stage.species.symbol).slice(0, QUESTIONS_PER_ROUND)}
        onComplete={(correctCount) => handleTriviaComplete(stage.sessionId, stage.species, correctCount)}
      />
    );
  }

  if (stage.kind === "result") {
    return (
      <div className="max-w-md rounded-lg border border-border bg-surface p-6 text-center">
        <div className="flex justify-center">
          <NodeRing value={stage.correctCount} max={QUESTIONS_PER_ROUND} size={120} />
        </div>
        <p className="mt-4 text-sm text-text-muted">
          {stage.correctCount} / {QUESTIONS_PER_ROUND} correct
        </p>
        <p className="font-numeric mt-1 text-2xl font-semibold tabular-nums">
          +{Number(stage.reward).toFixed(4)}
          <span className="ml-1.5 text-sm font-normal text-text-muted">{stage.species.symbol}</span>
        </p>
        <button
          onClick={() => setStage({ kind: "picking" })}
          className="mt-6 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white"
        >
          Back to species
        </button>
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
            attemptsUsedToday={attemptsUsedToday[s.id] ?? 0}
            dailyLimit={DAILY_LIMIT}
          />
        ))}
      </div>

      {species.length === 0 && (
        <p className="text-sm text-text-muted">No species available to mine right now.</p>
      )}

      <button
        onClick={startDiscovery}
        disabled={status.kind === "loading" || !selectedSpeciesId}
        className="mt-6 w-full max-w-md rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {status.kind === "loading" ? "Starting…" : "Answer 3 questions to discover"}
      </button>

      {status.kind === "error" && <p className="mt-4 text-sm text-error">{status.message}</p>}
    </div>
  );
}
