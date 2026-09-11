import Link from "next/link";
import { requireUser } from "@/lib/auth";
import type { WalletWithSpecies } from "@/lib/types";
import { AvatarBadge } from "@/components/AvatarIcon";
import { EditableDisplayName } from "@/components/EditableDisplayName";
import { AvatarPicker } from "@/components/AvatarPicker";

export default async function ProfilePage() {
  const { supabase, user, profile } = await requireUser();

  const { data: wallets } = await supabase
    .from("wallets")
    .select("*, species(*)")
    .eq("user_id", user.id)
    .returns<WalletWithSpecies[]>();

  const avatarId = profile?.avatar_id ?? "octopus";

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Profile</h1>

      <div className="mt-6 flex items-center gap-4">
        <AvatarBadge avatarId={avatarId} size={56} />
        <EditableDisplayName userId={user.id} initial={profile?.display_name ?? user.email ?? "Anonymous"} />
      </div>

      <section className="mt-8">
        <h2 className="text-base font-semibold">Avatar</h2>
        <div className="mt-3">
          <AvatarPicker userId={user.id} initial={avatarId} />
        </div>
      </section>

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

      <p className="mt-10 text-sm text-text-muted">
        Want to appear on the public leaderboard? Manage that in{" "}
        <Link href="/settings" className="text-accent hover:underline">
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
