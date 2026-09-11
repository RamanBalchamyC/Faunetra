import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AvatarBadge } from "@/components/AvatarIcon";
import { RARITY_TIER_STYLES } from "@/lib/design";
import type { AvatarId, RarityTier } from "@/lib/types";

type PublicProfileRow = {
  display_name: string;
  avatar_id: AvatarId;
  species_name: string;
  species_symbol: string;
  rarity_tier: RarityTier;
  balance: number;
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.rpc("get_public_profile", { p_user_id: userId });
  const rows = (data ?? []) as PublicProfileRow[];

  if (rows.length === 0) {
    return (
      <div>
        <Link href="/leaderboard" className="text-sm text-accent hover:underline">
          ← Back to leaderboard
        </Link>
        <p className="mt-6 text-sm text-text-muted">
          This user isn&apos;t visible on the public leaderboard — they may have opted out, hold
          no coins, or the profile doesn&apos;t exist.
        </p>
      </div>
    );
  }

  const { display_name, avatar_id } = rows[0];

  return (
    <div>
      <Link href="/leaderboard" className="text-sm text-accent hover:underline">
        ← Back to leaderboard
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <AvatarBadge avatarId={avatar_id} size={56} />
        <span className="text-lg font-semibold">{display_name}</span>
      </div>

      <h2 className="mt-8 text-base font-semibold">Collection</h2>
      <div className="mt-4 space-y-2">
        {rows.map((r) => {
          const tier = RARITY_TIER_STYLES[r.rarity_tier];
          return (
            <div key={r.species_symbol} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {r.species_name} ({r.species_symbol})
                <span className={`rounded-full px-2 py-0.5 text-xs ${tier.bg} ${tier.text}`}>
                  {r.rarity_tier}
                </span>
              </span>
              <span className="font-numeric font-medium tabular-nums">
                {Number(r.balance).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
