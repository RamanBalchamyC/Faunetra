"use client";

import { useState } from "react";
import type { WalletWithSpecies } from "@/lib/types";

export function SendForm({ wallets }: { wallets: WalletWithSpecies[] }) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [speciesId, setSpeciesId] = useState(wallets[0]?.species_id ?? "");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "error" | "success"; message?: string }>({
    kind: "idle",
  });

  const selectedWallet = wallets.find((w) => w.species_id === speciesId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "loading" });

    const idempotencyKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          speciesId,
          amount: Number(amount),
          idempotencyKey,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ kind: "error", message: data.error ?? "Transfer failed." });
        return;
      }

      setStatus({ kind: "success", message: `Sent ${amount} ${selectedWallet?.species.symbol}.` });
      setAmount("");
    } catch {
      setStatus({ kind: "error", message: "Network error — please try again." });
    }
  }

  if (wallets.length === 0) {
    return <p className="text-sm text-text-muted">You don&apos;t have any wallets to send from yet.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-5">
      <div>
        <label className="block text-sm font-medium text-text-primary">
          Recipient email
        </label>
        <input
          type="email"
          required
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="friend@example.com"
          className="mt-1.5 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary">Species</label>
        <select
          value={speciesId}
          onChange={(e) => setSpeciesId(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          {wallets.map((w) => (
            <option key={w.species_id} value={w.species_id}>
              {w.species.name} ({w.species.symbol}) — balance {Number(w.balance).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary">Amount</label>
        <input
          type="number"
          required
          min="0"
          step="any"
          max={selectedWallet ? Number(selectedWallet.balance) : undefined}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={status.kind === "loading"}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {status.kind === "loading" ? "Sending…" : "Send coins"}
      </button>

      {status.kind === "error" && <p className="text-sm text-error">{status.message}</p>}
      {status.kind === "success" && <p className="text-sm text-success">{status.message}</p>}
    </form>
  );
}
