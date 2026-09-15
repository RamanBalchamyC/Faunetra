import Link from "next/link";
import { requireUser } from "@/lib/auth";
import type { WalletWithSpecies } from "@/lib/types";
import { EditableDisplayName } from "@/components/EditableDisplayName";
import { CountrySelector } from "@/components/CountrySelector";
import { SignOutButton } from "@/components/SignOutButton";

export default async function ProfilePage() {
  const { supabase, user, profile } = await requireUser();

  const { data: wallets } = await supabase
    .from("wallets")
    .select("*, species(*)")
    .eq("user_id", user.id)
    .returns<WalletWithSpecies[]>();

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Profile</h1>

      <div className="mt-6">
        <EditableDisplayName userId={user.id} initial={profile?.display_name ?? user.email ?? "Anonymous"} />
      </div>

      <section className="mt-6">
        <label className="block text-sm font-medium text-text-primary">Country</label>
        <p className="mt-1 text-xs text-text-muted">
          Optional — shown next to your name on the leaderboard if you opt in.
        </p>
        <div className="mt-2">
          <CountrySelector userId={user.id} initial={profile?.country_code ?? null} />
        </div>
      </section>

      {(profile?.current_streak ?? 0) > 0 && (
        <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm">
          🔥 <span className="font-medium">{profile?.current_streak}-day discovery streak</span>
          {profile?.longest_streak && profile.longest_streak > (profile?.current_streak ?? 0) && (
            <span className="text-text-muted"> · best: {profile.longest_streak}</span>
          )}
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-base font-semibold">Your collection</h2>
        <div className="mt-4 space-y-2">
          {wallets?.map((w) => (
            <div key={w.id} className="flex items-center justify-between text-sm">
              <span>
                {w.species.name} ({w.species.symbol})
              </span>
              <span className="font-numeric font-medium tabular-nums">
                {Number(w.balance).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 space-y-3 border-t border-border pt-6">
        <Link href="/history" className="block text-sm text-accent hover:underline">
          Transaction History
        </Link>
        <Link href="/settings" className="block text-sm text-accent hover:underline">
          Settings
        </Link>
        <div className="pt-2">
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
