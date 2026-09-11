import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { SignOutButton } from "@/components/SignOutButton";

const LINKS = [
  { href: "/wallet", label: "Wallet" },
  { href: "/mining", label: "Mining" },
  { href: "/send", label: "Send" },
  { href: "/history", label: "History" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/impact", label: "Impact Fund" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
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
            <SignOutButton />
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
