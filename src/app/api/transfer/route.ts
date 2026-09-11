import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Thin server-side wrapper around the transfer_coins RPC. The RPC itself
// re-validates the caller (auth.uid()) and balances — this route exists so
// the client never needs (and never gets) a way to call it with someone
// else's from_user_id, and so we can resolve the recipient's email to an
// id server-side via the restricted find_user_by_email RPC.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const { recipientEmail, speciesId, amount, idempotencyKey } = body as {
    recipientEmail?: string;
    speciesId?: string;
    amount?: number;
    idempotencyKey?: string;
  };

  if (!recipientEmail || !speciesId || !amount || !idempotencyKey) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (typeof amount !== "number" || !(amount > 0)) {
    return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
  }

  const { data: recipientId, error: lookupError } = await supabase.rpc("find_user_by_email", {
    p_email: recipientEmail.trim().toLowerCase(),
  });

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }
  if (!recipientId) {
    return NextResponse.json({ error: "No Faunetra user found with that email." }, { status: 404 });
  }
  if (recipientId === user.id) {
    return NextResponse.json({ error: "You can't send coins to yourself." }, { status: 400 });
  }

  const { data: transactionId, error: transferError } = await supabase.rpc("transfer_coins", {
    p_from_user_id: user.id,
    p_to_user_id: recipientId,
    p_species_id: speciesId,
    p_amount: amount,
    p_idempotency_key: idempotencyKey,
  });

  if (transferError) {
    return NextResponse.json({ error: transferError.message }, { status: 400 });
  }

  return NextResponse.json({ transactionId });
}
