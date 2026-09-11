import { getOptionalUser } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";
import { AssistantWidget } from "@/components/AssistantWidget";

// Wraps every screen that has the app nav (wallet, mining, send, history,
// impact, profile). Impact is intentionally reachable while signed out —
// the middleware allow-lists it — so this layout must not assume a user.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getOptionalUser();

  return (
    <div className="min-h-screen">
      <NavBar signedIn={!!user} />
      <div className="mx-auto max-w-4xl px-6 py-10">{children}</div>
      {/* The assistant API requires auth, so only render the FAB when
          signed in (e.g. not for anonymous visitors on the public /impact
          page) rather than showing a control that would just error. */}
      {user && <AssistantWidget />}
    </div>
  );
}
