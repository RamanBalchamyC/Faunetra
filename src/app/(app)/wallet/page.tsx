import Link from "next/link";
import { requireUser } from "@/lib/auth";
import type { WalletWithSpecies } from "@/lib/types";
import { RARITY_TIER_STYLES } from "@/lib/design";

export default async function WalletPage() {
  const { supabase, user } = await requireUser();

  const { data: wallets, error } = await supabase
    .from("wallets")
    .select("*, species(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .returns<WalletWithSpecies[]>();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-primary">Your Wallet</h1>
          <p className="mt-1 max-w-md text-sm text-text-muted">
            Coins have no real-world monetary value — they represent your contribution and
            collection progress for each species.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/send"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
          >
            Send coins
          </Link>
          <Link
            href="/history"
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-primary hover:border-accent hover:text-accent"
          >
            History
          </Link>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-error/30 bg-error/5 p-4 text-sm text-error">
          Could not load your wallets: {error.message}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {wallets?.map((wallet) => {
          const tier = RARITY_TIER_STYLES[wallet.species.rarity_tier];
          return (
            <div key={wallet.id} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-muted">{wallet.species.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs tracking-wide ${tier.bg} ${tier.text}`}
                >
                  {wallet.species.rarity_tier}
                </span>
              </div>
              <div className="mt-2 font-numeric text-2xl font-semibold tabular-nums">
                {Number(wallet.balance).toLocaleString()}
                <span className="ml-1.5 text-sm font-normal text-text-muted">
                  {wallet.species.symbol}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {wallets?.length === 0 && (
        <p className="mt-8 text-sm text-text-muted">
          No wallets yet — they&apos;re created automatically on sign-up. Try refreshing.
        </p>
      )}
    </div>
  );
}
