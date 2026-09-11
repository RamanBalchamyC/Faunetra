import type { Species } from "@/lib/types";
import { RARITY_TIER_STYLES } from "@/lib/design";

export function SpeciesCard({
  species,
  selected,
  onSelect,
}: {
  species: Species;
  selected: boolean;
  onSelect: () => void;
}) {
  const tier = RARITY_TIER_STYLES[species.rarity_tier];
  const remaining = Math.max(species.total_supply - species.circulating_supply, 0);
  const pctMined = Math.min((species.circulating_supply / species.total_supply) * 100, 100);
  const fullyDiscovered = remaining <= 0;

  return (
    <button
      type="button"
      onClick={fullyDiscovered ? undefined : onSelect}
      disabled={fullyDiscovered}
      className={`relative rounded-lg border p-4 text-left transition ${
        fullyDiscovered
          ? "cursor-not-allowed border-border bg-black/[0.02] opacity-60 grayscale"
          : selected
            ? "border-primary bg-primary/5"
            : "border-border bg-surface hover:border-accent"
      }`}
    >
      {fullyDiscovered && (
        <span className="absolute right-3 top-3 rounded-full bg-text-primary px-2 py-0.5 text-[10px] font-medium tracking-wide text-white">
          ✓ Discovered
        </span>
      )}

      <div className="flex items-center gap-3">
        <SpeciesSilhouette imageUrl={species.image_url} />
        <div>
          <div className="text-sm font-semibold">{species.name}</div>
          {species.scientific_name && (
            <div className="text-xs italic text-text-muted">{species.scientific_name}</div>
          )}
        </div>
      </div>

      <span className={`mt-3 inline-block rounded-full px-2 py-0.5 text-xs ${tier.bg} ${tier.text}`}>
        {species.rarity_tier}
      </span>

      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
          <div
            className={`h-full rounded-full ${tier.dot}`}
            style={{ width: `${pctMined}%` }}
          />
        </div>
        <div className="mt-1 font-numeric text-xs tabular-nums text-text-muted">
          {remaining.toLocaleString()} / {species.total_supply.toLocaleString()} remaining
        </div>
      </div>
    </button>
  );
}

function SpeciesSilhouette({ imageUrl }: { imageUrl: string | null }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- external, unknown-dimension source images
    return <img src={imageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />;
  }
  // Placeholder node-motif silhouette until real species imagery is synced.
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="none" stroke="var(--color-border)" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="4" fill="var(--color-accent)" />
      <circle cx="12" cy="14" r="1.6" fill="var(--color-accent)" opacity="0.6" />
      <circle cx="28" cy="14" r="1.6" fill="var(--color-accent)" opacity="0.6" />
      <circle cx="12" cy="27" r="1.6" fill="var(--color-accent)" opacity="0.6" />
      <circle cx="28" cy="27" r="1.6" fill="var(--color-accent)" opacity="0.6" />
    </svg>
  );
}
