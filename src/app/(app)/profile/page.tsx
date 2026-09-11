import { requireUser } from "@/lib/auth";
import type { WalletWithSpecies } from "@/lib/types";
import { LeaderboardOptIn } from "./LeaderboardOptIn";

type LeaderboardRow = { display_name: string; total_balance: number };

export default async function ProfilePage() {
  const { supabase, user, profile } = await requireUser();

  const [{ data: wallets }, { data: leaderboardRaw }] = await Promise.all([
    supabase
      .from("wallets")
      .select("*, species(*)")
      .eq("user_id", user.id)
      .returns<WalletWithSpecies[]>(),
    supabase.rpc("get_leaderboard"),
  ]);
  const leaderboard = (leaderboardRaw ?? []) as LeaderboardRow[];

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
      <div className="mt-2 text-sm text-neutral-500">{profile?.display_name ?? user.email}</div>

      <h2 className="mt-8 text-base font-semibold">Your collection</h2>
      <div className="mt-4 space-y-2">
        {wallets?.map((w) => (
          <div key={w.id} className="flex items-center justify-between text-sm">
            <span>
              {w.species.name} ({w.species.symbol})
            </span>
            <span className="font-medium tabular-nums">{Number(w.balance).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-base font-semibold">Leaderboard</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Opt-in only — most users won&apos;t appear here unless they choose to.
      </p>
      <div className="mt-3">
        <LeaderboardOptIn userId={user.id} initialOptIn={profile?.leaderboard_opt_in ?? false} />
      </div>
      <div className="mt-5 space-y-2">
        {(leaderboard ?? []).map((row, i) => (
          <div key={`${row.display_name}-${i}`} className="flex items-center justify-between text-sm">
            <span>
              {i + 1}. {row.display_name}
            </span>
            <span className="font-medium tabular-nums">
              {Number(row.total_balance).toLocaleString()}
            </span>
          </div>
        ))}
        {leaderboard?.length === 0 && (
          <p className="text-sm text-neutral-500">No one has opted in yet.</p>
        )}
      </div>
    </div>
  );
}
