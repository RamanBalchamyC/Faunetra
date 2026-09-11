import { createClient } from "@/lib/supabase/server";
import type { ImpactFundLogEntry, Species } from "@/lib/types";

export default async function ImpactPage() {
  const supabase = await createClient();

  const [{ data: species }, { data: log }] = await Promise.all([
    supabase.from("species").select("*").returns<Species[]>(),
    supabase
      .from("impact_fund_log")
      .select("*")
      .order("donated_at", { ascending: false })
      .returns<ImpactFundLogEntry[]>(),
  ]);

  const totalMined = (species ?? []).reduce((sum, s) => sum + Number(s.circulating_supply), 0);
  const totalDonatedInr = (log ?? []).reduce((sum, l) => sum + Number(l.amount_donated_inr), 0);

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Impact Fund</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
        Faunetra coins are symbolic — pledging them does not move real money and is not a
        donation. What&apos;s below is a fully separate, real, founder-funded pledge: periodically,
        the developer personally donates to a real conservation organization, sized loosely
        against total coins mined platform-wide. This is <strong>not</strong> a corporate
        partnership or an automated donation — every entry is logged manually with a receipt
        where available.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
          <div className="text-sm text-neutral-500">Total coins mined (platform-wide)</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {totalMined.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
          <div className="text-sm text-neutral-500">Real donations to date (founder-funded)</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            ₹{totalDonatedInr.toLocaleString()}
          </div>
        </div>
      </div>

      <h2 className="mt-10 text-base font-semibold">Donation log</h2>
      <div className="mt-4 divide-y divide-neutral-200 dark:divide-neutral-800">
        {log?.map((entry) => (
          <div key={entry.id} className="py-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{entry.recipient_org}</span>
              <span className="tabular-nums">₹{Number(entry.amount_donated_inr).toLocaleString()}</span>
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              {new Date(entry.donated_at).toLocaleDateString()} · at{" "}
              {Number(entry.total_coins_pledged_at_time).toLocaleString()} coins mined
            </div>
            {entry.note && <p className="mt-1 text-xs text-neutral-500">{entry.note}</p>}
            {entry.receipt_url && (
              <a
                href={entry.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-blue-600 underline"
              >
                View receipt
              </a>
            )}
          </div>
        ))}

        {log?.length === 0 && (
          <p className="py-6 text-sm text-neutral-500">
            No donations logged yet. The first entry will appear here once made, with a receipt.
          </p>
        )}
      </div>
    </div>
  );
}
