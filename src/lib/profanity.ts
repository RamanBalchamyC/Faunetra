// Deliberately simple substring blocklist — not a robust profanity filter,
// just a basic guard against the most obvious cases for a solo-dev,
// friends-shared app. Revisit if the user base grows beyond people you know.
const BLOCKLIST = ["fuck", "shit", "bitch", "cunt", "nigger", "faggot", "retard"];

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKLIST.some((word) => lower.includes(word));
}
