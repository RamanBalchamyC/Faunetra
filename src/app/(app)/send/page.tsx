import { requireUser } from "@/lib/auth";
import type { WalletWithSpecies } from "@/lib/types";
import { SendForm } from "./SendForm";

export default async function SendPage() {
  const { supabase, user } = await requireUser();

  const { data: wallets } = await supabase
    .from("wallets")
    .select("*, species(*)")
    .eq("user_id", user.id)
    .gt("balance", 0)
    .returns<WalletWithSpecies[]>();

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Send Coins</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Transfer coins to another Faunetra user by their sign-in email.
      </p>
      <div className="mt-8">
        <SendForm wallets={wallets ?? []} />
      </div>
    </div>
  );
}
