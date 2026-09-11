import { requireUser } from "@/lib/auth";
import type { Species, Transaction } from "@/lib/types";

type TxRow = Transaction & { species: Species };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ species?: string; type?: string }>;
}) {
  const { supabase } = await requireUser();
  const { species: speciesFilter, type: typeFilter } = await searchParams;

  const { data: wallets } = await supabase.from("wallets").select("id, species_id, species(*)");
  const walletIds = new Set((wallets ?? []).map((w) => w.id));
  const allSpecies = (wallets ?? []).map((w) => w.species).filter(Boolean) as unknown as Species[];

  let query = supabase
    .from("transactions")
    .select("*, species(*)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (speciesFilter) query = query.eq("species_id", speciesFilter);
  if (typeFilter) query = query.eq("type", typeFilter);

  const { data: transactions, error } = await query.returns<TxRow[]>();

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Transaction History</h1>
      <p className="mt-1 text-sm text-neutral-500">
        A chronological ledger of everything that has happened to your wallets.
      </p>

      <form className="mt-6 flex flex-wrap gap-3 text-sm" method="get">
        <select
          name="species"
          defaultValue={speciesFilter ?? ""}
          className="rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">All species</option>
          {allSpecies.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={typeFilter ?? ""}
          className="rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">All types</option>
          <option value="INITIAL_GRANT">Initial grant</option>
          <option value="MINING_REWARD">Mining reward</option>
          <option value="TRANSFER">Transfer</option>
          <option value="PLEDGE">Pledge</option>
        </select>
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-1.5 dark:border-neutral-700"
        >
          Filter
        </button>
      </form>

      {error && <p className="mt-6 text-sm text-red-600">Could not load history: {error.message}</p>}

      <div className="mt-6 divide-y divide-neutral-200 dark:divide-neutral-800">
        {transactions?.map((tx) => {
          const direction = walletIds.has(tx.to_wallet_id ?? "")
            ? "in"
            : walletIds.has(tx.from_wallet_id ?? "")
              ? "out"
              : "neutral";

          return (
            <div key={tx.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="font-medium">{formatType(tx.type)}</div>
                <div className="text-xs text-neutral-500">
                  {new Date(tx.created_at).toLocaleString()}
                </div>
              </div>
              <div
                className={
                  direction === "in"
                    ? "font-medium text-green-600"
                    : direction === "out"
                      ? "font-medium text-red-600"
                      : "font-medium text-neutral-500"
                }
              >
                {direction === "in" ? "+" : direction === "out" ? "-" : ""}
                {Number(tx.amount).toLocaleString()} {tx.species.symbol}
              </div>
            </div>
          );
        })}

        {transactions?.length === 0 && (
          <p className="py-6 text-sm text-neutral-500">No transactions yet.</p>
        )}
      </div>
    </div>
  );
}

function formatType(type: TxRow["type"]) {
  switch (type) {
    case "INITIAL_GRANT":
      return "Initial grant";
    case "MINING_REWARD":
      return "Mining reward";
    case "TRANSFER":
      return "Transfer";
    case "PLEDGE":
      return "Pledge";
    default:
      return type;
  }
}
