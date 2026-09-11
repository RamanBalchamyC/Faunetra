import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Use in Server Components, Route Handlers, and Server Actions.
// Not passing our hand-written Database type as the client's generic — see
// the comment in src/lib/supabase/client.ts for why. Row shapes are typed
// explicitly via `.returns<T>()` at each call site instead.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component (no `cookies().set`). Safe to
            // ignore as long as middleware.ts is refreshing the session.
          }
        },
      },
    }
  );
}
