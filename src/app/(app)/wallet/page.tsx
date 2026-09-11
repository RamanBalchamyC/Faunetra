import { requireUser } from "@/lib/auth";
import type { WalletWithSpecies } from "@/lib/types";

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
      <h1 className="text-xl font-semibold tracking-tight">Your Wallet</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Coins have no real-world monetary value — they represent your contribution and
        collection progress for each species.
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load your wallets: {error.message}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {wallets?.map((wallet) => (
          <div
            key={wallet.id}
            className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-500">{wallet.species.name}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-800">
                {wallet.species.rarity_tier}
              </span>
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {Number(wallet.balance).toLocaleString()}
              <span className="ml-1.5 text-sm font-normal text-neutral-400">
                {wallet.species.symbol}
              </span>
            </div>
          </div>
        ))}
      </div>

      {wallets?.length === 0 && (
        <p className="mt-8 text-sm text-neutral-500">
          No wallets yet — they&apos;re created automatically on sign-up. Try refreshing.
        </p>
      )}
    </div>
  );
}
