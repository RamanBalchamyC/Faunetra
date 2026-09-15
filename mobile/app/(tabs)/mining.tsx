import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/providers/SessionProvider";
import { useAppTheme } from "@/hooks/useAppTheme";
import { RARITY_TIER_COLOR_KEY } from "@/constants/theme";
import { pickTriviaRound, type TriviaRoundPick } from "@/lib/mining-questions";
import type { Species } from "@/lib/types";

const DAILY_LIMIT = 5;
const QUESTIONS_PER_ROUND = 3;

type Stage =
  | { kind: "picking" }
  | { kind: "trivia"; sessionId: string; species: Species; round: TriviaRoundPick }
  | { kind: "result"; species: Species; correctCount: number; reward: number };

export default function MiningScreen() {
  const { colors } = useAppTheme();
  const { user, profile } = useSession();
  const [species, setSpecies] = useState<Species[]>([]);
  const [attemptsUsedToday, setAttemptsUsedToday] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState("");
  const [stage, setStage] = useState<Stage>({ kind: "picking" });
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "error"; message?: string }>({
    kind: "idle",
  });

  const load = useCallback(async () => {
    if (!user) return;
    const { data: speciesData } = await supabase
      .from("species")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });
    const list = (speciesData as Species[]) ?? [];
    setSpecies(list);
    if (!selectedId && list[0]) setSelectedId(list[0].id);

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const { data: sessionsToday } = await supabase
      .from("mining_sessions")
      .select("species_id")
      .eq("user_id", user.id)
      .gte("started_at", startOfDay.toISOString());
    const counts: Record<string, number> = {};
    for (const row of sessionsToday ?? []) counts[row.species_id] = (counts[row.species_id] ?? 0) + 1;
    setAttemptsUsedToday(counts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function startDiscovery() {
    const selected = species.find((s) => s.id === selectedId);
    if (!selected || !user) return;
    setStatus({ kind: "loading" });

    const [sessionResult, seenResult] = await Promise.all([
      supabase.rpc("start_mining_session", { p_species_id: selected.id }),
      supabase.from("mining_question_seen").select("question_key").eq("species_id", selected.id),
    ]);

    if (sessionResult.error) return setStatus({ kind: "error", message: sessionResult.error.message });
    if (seenResult.error) return setStatus({ kind: "error", message: seenResult.error.message });

    const seenKeys = new Set((seenResult.data ?? []).map((r) => r.question_key));
    const round = pickTriviaRound(selected.symbol, seenKeys, QUESTIONS_PER_ROUND);
    setStatus({ kind: "idle" });
    setStage({ kind: "trivia", sessionId: sessionResult.data as string, species: selected, round });
  }

  async function handleAnswerComplete(correctCount: number, answeredKeys: string[]) {
    if (stage.kind !== "trivia" || !user) return;
    setStatus({ kind: "loading" });

    const [settleResult] = await Promise.all([
      supabase.rpc("settle_mining_session", {
        p_session_id: stage.sessionId,
        p_contribution_score: correctCount,
      }),
      supabase.from("mining_question_seen").upsert(
        answeredKeys.map((question_key) => ({ user_id: user.id, species_id: stage.species.id, question_key })),
        { onConflict: "user_id,species_id,question_key", ignoreDuplicates: true }
      ),
    ]);
    setStatus({ kind: "idle" });

    if (settleResult.error) {
      setStatus({ kind: "error", message: settleResult.error.message });
      setStage({ kind: "picking" });
      return;
    }

    setStage({
      kind: "result",
      species: stage.species,
      correctCount,
      reward: (settleResult.data as number) ?? 0,
    });
    load();
  }

  if (stage.kind === "trivia") {
    return (
      <TriviaRoundView
        round={stage.round}
        colors={colors}
        onComplete={handleAnswerComplete}
        loading={status.kind === "loading"}
      />
    );
  }

  if (stage.kind === "result") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular" }}>
          {stage.correctCount} / {QUESTIONS_PER_ROUND} correct
        </Text>
        <Text style={{ color: colors.textPrimary, fontFamily: "Poppins_600SemiBold", fontSize: 28, marginTop: 8 }}>
          +{Number(stage.reward).toFixed(4)} {stage.species.symbol}
        </Text>
        <Pressable
          onPress={() => setStage({ kind: "picking" })}
          style={[styles.button, { backgroundColor: colors.primary, marginTop: 24 }]}
        >
          <Text style={styles.buttonText}>Back to species</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Mining Hub</Text>
          <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 13 }}>
            Answer 3 real conservation trivia questions to discover coins.
          </Text>
        </View>
        {(profile?.current_streak ?? 0) > 0 && (
          <View style={[styles.streakPill, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium", fontSize: 13 }}>
              🔥 {profile?.current_streak}-day
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={species}
        keyExtractor={(item) => item.id}
        numColumns={1}
        contentContainerStyle={{ gap: 10, paddingVertical: 16 }}
        renderItem={({ item }) => {
          const remaining = Math.max(item.total_supply - item.circulating_supply, 0);
          const attemptsLeft = Math.max(DAILY_LIMIT - (attemptsUsedToday[item.id] ?? 0), 0);
          const disabled = remaining <= 0 || attemptsLeft <= 0;
          const tierColorKey = RARITY_TIER_COLOR_KEY[item.rarity_tier] ?? "textMuted";
          const selected = item.id === selectedId;
          return (
            <Pressable
              disabled={disabled}
              onPress={() => setSelectedId(item.id)}
              style={[
                styles.speciesCard,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: colors.surface,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              <Text style={{ color: colors.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                {item.name}
              </Text>
              <Text style={{ color: colors[tierColorKey], fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 }}>
                {item.rarity_tier}
              </Text>
              <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 }}>
                {remaining <= 0 ? "Fully discovered" : `${attemptsLeft}/${DAILY_LIMIT} discoveries left today`}
              </Text>
            </Pressable>
          );
        }}
      />

      <Pressable
        onPress={startDiscovery}
        disabled={!selectedId || status.kind === "loading"}
        style={[styles.button, { backgroundColor: colors.primary, opacity: status.kind === "loading" ? 0.6 : 1 }]}
      >
        <Text style={styles.buttonText}>{status.kind === "loading" ? "Starting…" : "Answer 3 questions to discover"}</Text>
      </Pressable>
      {status.kind === "error" && <Text style={{ color: colors.error, marginTop: 8 }}>{status.message}</Text>}
    </View>
  );
}

function TriviaRoundView({
  round,
  colors,
  onComplete,
  loading,
}: {
  round: TriviaRoundPick;
  colors: ReturnType<typeof useAppTheme>["colors"];
  onComplete: (correctCount: number, answeredKeys: string[]) => void;
  loading: boolean;
}) {
  const [step, setStep] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [revealed, setRevealed] = useState<{ correct: boolean } | null>(null);
  const question = round.questions[step];
  const isLast = step === round.questions.length - 1;

  function answer(chosen: boolean) {
    if (revealed) return;
    const correct = chosen === question.answer;
    setRevealed({ correct });
    if (correct) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (isLast) {
      onComplete(correctCount, round.questions.map((q) => q.key));
      return;
    }
    setStep((s) => s + 1);
    setRevealed(null);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center" }]}>
      {round.mastered && step === 0 && (
        <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium", fontSize: 12, marginBottom: 12 }}>
          🏆 You&apos;ve seen all of this species&apos; questions — here&apos;s a recap round.
        </Text>
      )}
      <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>
        Question {step + 1} of {round.questions.length}
      </Text>
      <Text style={{ color: colors.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 17, marginTop: 8 }}>
        {question.question}
      </Text>

      {!revealed ? (
        <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
          <Pressable onPress={() => answer(true)} style={[styles.answerButton, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textPrimary, fontFamily: "Inter_600SemiBold" }}>True</Text>
          </Pressable>
          <Pressable onPress={() => answer(false)} style={[styles.answerButton, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textPrimary, fontFamily: "Inter_600SemiBold" }}>False</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ marginTop: 20, gap: 8 }}>
          <Text style={{ color: revealed.correct ? colors.success : colors.error, fontFamily: "Inter_600SemiBold" }}>
            {revealed.correct ? "Correct!" : `Not quite — the answer was ${question.answer ? "True" : "False"}.`}
          </Text>
          <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 13 }}>{question.fact}</Text>
          <Pressable
            onPress={next}
            disabled={loading}
            style={[styles.button, { backgroundColor: colors.primary, marginTop: 8, opacity: loading ? 0.6 : 1 }]}
          >
            <Text style={styles.buttonText}>{isLast ? (loading ? "Settling…" : "See result") : "Next question"}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  title: { fontFamily: "Poppins_600SemiBold", fontSize: 20 },
  streakPill: { borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  speciesCard: { borderWidth: 1, borderRadius: 12, padding: 14 },
  button: { borderRadius: 8, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  buttonText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  answerButton: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: "center" },
});
