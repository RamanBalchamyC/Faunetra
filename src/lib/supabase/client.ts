"use client";

import { createBrowserClient } from "@supabase/ssr";

// Not passing our hand-written Database type as the client's generic: without
// a live project to run `supabase gen types` against, it doesn't fully match
// supabase-js's generic constraints (embedded selects like `species(*)` and
// rpc() args resolve to `never`). Row shapes are still typed explicitly via
// `.returns<T>()` at each call site — see src/lib/types.ts.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
