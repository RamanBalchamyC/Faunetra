"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Species } from "@/lib/types";
import { pickTriviaRound, type TriviaRoundPick } from "@/lib/mining-questions";
import { SpeciesCard } from "./SpeciesCard";
import { TriviaRound } from "./TriviaRound";
import { NodeRing } from "./NodeRing";

const DAILY_LIMIT = 5;
const QUESTIONS_PER_ROUND = 3;

type Stage =
  | { kind: "picking" }
  | { kind: "trivia"; sessionId: string; species: Species; round: TriviaRoundPick }
  | { kind: "result"; species: Species; correctCount: number; reward: number };

export function MiningHub({
  species,
  attemptsUsedToday,
  userId,
}: {
  species: Species[];
  attemptsUsedToday: Record<string, number>;
  userId: string;
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

    const [{ data: sessionId, error: sessionError }, { data: seenRows, error: seenError }] = await Promise.all([
      supabase.rpc("start_mining_session", { p_species_id: selected.id }),
      supabase.from("mining_question_seen").select("question_key").eq("species_id", selected.id),
    ]);

    if (sessionError) {
      setStatus({ kind: "error", message: sessionError.message });
      return;
    }
    if (seenError) {
      setStatus({ kind: "error", message: seenError.message });
      return;
    }

    const seenKeys = new Set((seenRows ?? []).map((r) => r.question_key));
    const round = pickTriviaRound(selected.symbol, seenKeys, QUESTIONS_PER_ROUND);

    setStatus({ kind: "idle" });
    setStage({ kind: "trivia", sessionId: sessionId as string, species: selected, round });
  }

  async function handleTriviaComplete(
    sessionId: string,
    targetSpecies: Species,
    correctCount: number,
    answeredKeys: string[]
  ) {
    setStatus({ kind: "loading" });
    const supabase = createClient();

    // Record seen questions and settle the session in parallel — the seen
    // record isn't security-sensitive (RLS just scopes it to the caller),
    // unlike the reward settlement which goes through the RPC.
    const [{ data: reward, error }] = await Promise.all([
      supabase.rpc("settle_mining_session", { p_session_id: sessionId, p_contribution_score: correctCount }),
      supabase.from("mining_question_seen").upsert(
        answeredKeys.map((question_key) => ({
          user_id: userId,
          species_id: targetSpecies.id,
          question_key,
        })),
        { onConflict: "user_id,species_id,question_key", ignoreDuplicates: true }
      ),
    ]);
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
        round={stage.round}
        onComplete={(correctCount, answeredKeys) =>
          handleTriviaComplete(stage.sessionId, stage.species, correctCount, answeredKeys)
        }
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
