"use client";

import { useState } from "react";
import type { TriviaRoundPick } from "@/lib/mining-questions";

export function TriviaRound({
  round,
  onComplete,
}: {
  round: TriviaRoundPick;
  onComplete: (correctCount: number, answeredKeys: string[]) => void;
}) {
  const { questions, mastered } = round;
  const [step, setStep] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [revealed, setRevealed] = useState<{ chosen: boolean; correct: boolean } | null>(null);

  const question = questions[step];
  const isLast = step === questions.length - 1;

  function answer(chosen: boolean) {
    if (revealed) return;
    const correct = chosen === question.answer;
    setRevealed({ chosen, correct });
    if (correct) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (isLast) {
      // correctCount already reflects this question's answer() call, which
      // ran (and re-rendered) before the user could click this button.
      onComplete(correctCount, questions.map((q) => q.key));
      return;
    }
    setStep((s) => s + 1);
    setRevealed(null);
  }

  return (
    <div className="max-w-md rounded-lg border border-border bg-surface p-6">
      {mastered && step === 0 && (
        <p className="mb-4 rounded-md bg-primary/5 px-3 py-2 text-xs text-primary">
          🏆 You&apos;ve seen all of this species&apos; questions before — here&apos;s a recap round.
        </p>
      )}
      <div className="text-xs text-text-muted">
        Question {step + 1} of {questions.length}
      </div>
      <p className="mt-2 text-base font-medium">{question.question}</p>

      {!revealed ? (
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => answer(true)}
            className="flex-1 rounded-md border border-border py-2.5 text-sm font-medium hover:border-accent hover:text-accent"
          >
            True
          </button>
          <button
            onClick={() => answer(false)}
            className="flex-1 rounded-md border border-border py-2.5 text-sm font-medium hover:border-accent hover:text-accent"
          >
            False
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <p className={`text-sm font-medium ${revealed.correct ? "text-success" : "text-error"}`}>
            {revealed.correct ? "Correct!" : `Not quite — the answer was ${question.answer ? "True" : "False"}.`}
          </p>
          <p className="text-sm text-text-muted">{question.fact}</p>
          <button
            onClick={next}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white"
          >
            {isLast ? "See result" : "Next question"}
          </button>
        </div>
      )}
    </div>
  );
}
