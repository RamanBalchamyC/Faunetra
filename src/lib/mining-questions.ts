import { getTriviaForSpecies, type TriviaQuestion } from "@/lib/species-trivia";

export function questionKey(symbol: string, index: number): string {
  return `${symbol}-${index}`;
}

export type TriviaRoundPick = {
  questions: (TriviaQuestion & { key: string })[];
  mastered: boolean; // true if the unseen pool couldn't fully cover this round
};

// Prioritizes questions the user hasn't seen yet for this species; once the
// pool is exhausted (or nearly), fills any remaining slots by recycling
// already-seen questions and flags `mastered` so the UI can show a
// "you've seen all of these" acknowledgment instead of pretending it's new.
export function pickTriviaRound(symbol: string, seenKeys: Set<string>, count: number): TriviaRoundPick {
  const all = getTriviaForSpecies(symbol).map((q, i) => ({ ...q, key: questionKey(symbol, i) }));
  const unseen = shuffle(all.filter((q) => !seenKeys.has(q.key)));
  const seen = shuffle(all.filter((q) => seenKeys.has(q.key)));

  if (unseen.length >= count) {
    return { questions: unseen.slice(0, count), mastered: false };
  }

  const filler = seen.slice(0, count - unseen.length);
  return { questions: [...unseen, ...filler], mastered: true };
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
