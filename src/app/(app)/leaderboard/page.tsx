import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AvatarBadge } from "@/components/AvatarIcon";
import type { AvatarId } from "@/lib/types";

type LeaderboardRow = { user_id: string; display_name: string; avatar_id: AvatarId; total_balance: number };

export default async function LeaderboardPage() {
  const { supabase } = await requireUser();
  const { data: rows } = await supabase.rpc("get_leaderboard");
  const leaderboard = (rows ?? []) as LeaderboardRow[];

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Leaderboard</h1>
      <p className="mt-1 text-sm text-text-muted">
        Ranked by total coins held across all species. Opt-in only — most users won&apos;t appear
        here unless they&apos;ve turned it on in Settings.
      </p>

      <div className="mt-6 divide-y divide-border">
        {leaderboard.map((row, i) => (
          <Link
            key={row.user_id}
            href={`/leaderboard/${row.user_id}`}
            className="flex items-center gap-4 py-3 hover:bg-primary/5"
          >
            <span className="w-6 text-sm text-text-muted">{i + 1}</span>
            <AvatarBadge avatarId={row.avatar_id} size={36} />
            <span className="flex-1 text-sm font-medium">{row.display_name}</span>
            <span className="font-numeric text-sm font-medium tabular-nums">
              {Number(row.total_balance).toLocaleString()}
            </span>
          </Link>
        ))}

        {leaderboard.length === 0 && (
          <p className="py-6 text-sm text-text-muted">No one has opted in yet.</p>
        )}
      </div>
    </div>
  );
}
