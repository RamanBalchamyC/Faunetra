import type { RarityTier } from "@/lib/types";

// Rarity tier → color coding (section 0 of the Phase 2 brief). Order here
// is lightest → heaviest visual weight, useful for sorting species lists.
export const RARITY_TIERS: RarityTier[] = [
  "Least Concern",
  "Near Threatened",
  "Vulnerable",
  "Endangered",
  "Critically Endangered",
];

export const RARITY_TIER_STYLES: Record<RarityTier, { text: string; bg: string; dot: string }> = {
  "Least Concern": { text: "text-text-muted", bg: "bg-text-muted/10", dot: "bg-text-muted" },
  "Near Threatened": { text: "text-accent", bg: "bg-accent/10", dot: "bg-accent" },
  Vulnerable: { text: "text-warning", bg: "bg-warning/10", dot: "bg-warning" },
  Endangered: { text: "text-endangered", bg: "bg-endangered/10", dot: "bg-endangered" },
  "Critically Endangered": { text: "text-primary", bg: "bg-primary/10", dot: "bg-primary" },
};
