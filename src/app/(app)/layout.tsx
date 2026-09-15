import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";
import { AssistantWidget } from "@/components/AssistantWidget";

// Wraps every screen that has the app nav (wallet, mining, send, history,
// impact, profile). Impact is intentionally reachable while signed out —
// the middleware allow-lists it — so this layout must not assume a user.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getOptionalUser();

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar signedIn={!!user} />
      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">{children}</div>
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-text-muted">
        <Link href="/impact" className="hover:text-primary">
          Impact Fund
        </Link>
      </footer>
      {/* The assistant API requires auth, so only render the FAB when
          signed in (e.g. not for anonymous visitors on the public /impact
          page) rather than showing a control that would just error. */}
      {user && <AssistantWidget />}
    </div>
  );
}
