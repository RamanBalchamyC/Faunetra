import { requireUser } from "@/lib/auth";
import { ThemeSelector } from "@/components/ThemeSelector";
import { LeaderboardOptIn } from "@/components/LeaderboardOptIn";

export default async function SettingsPage() {
  const { user, profile } = await requireUser();

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      <section className="mt-8">
        <h2 className="text-base font-semibold">Appearance</h2>
        <p className="mt-1 text-sm text-text-muted">
          System follows your device&apos;s light/dark setting automatically.
        </p>
        <div className="mt-3">
          <ThemeSelector userId={user.id} initial={profile?.theme_preference ?? "system"} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-base font-semibold">Leaderboard</h2>
        <p className="mt-1 text-sm text-text-muted">
          Off by default. When on, your display name, country flag (if set), and collection
          totals are visible to other signed-in users on the leaderboard.
        </p>
        <div className="mt-3">
          <LeaderboardOptIn userId={user.id} initialOptIn={profile?.leaderboard_opt_in ?? false} />
        </div>
      </section>
    </div>
  );
}
