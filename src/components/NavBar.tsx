import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";

// Primary nav per the Phase 3 nav-restructure brief — just these four.
// Send lives on the Wallet page; History and Settings live under Profile;
// Impact Fund is in the page footer (see AppLayout) since it's meant to be
// reachable by signed-out visitors too, not tucked inside account nav.
const LINKS = [
  { href: "/wallet", label: "Wallet" },
  { href: "/mining", label: "Mining" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile", label: "Profile" },
];

export function NavBar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link
          href={signedIn ? "/wallet" : "/login"}
          className="flex items-center gap-2 text-base font-semibold tracking-tight text-primary"
        >
          <LogoMark size={26} />
          Faunetra
        </Link>
        {signedIn ? (
          <nav className="flex flex-wrap items-center gap-5">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-text-muted hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : (
          <nav className="flex items-center gap-5">
            <Link href="/impact" className="text-sm text-text-muted hover:text-primary">
              Impact Fund
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
            >
              Sign in
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
