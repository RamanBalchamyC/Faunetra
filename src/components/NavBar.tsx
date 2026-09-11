import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

const LINKS = [
  { href: "/wallet", label: "Wallet" },
  { href: "/mining", label: "Mining" },
  { href: "/send", label: "Send" },
  { href: "/history", label: "History" },
  { href: "/impact", label: "Impact Fund" },
  { href: "/profile", label: "Profile" },
];

export function NavBar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href={signedIn ? "/wallet" : "/login"} className="text-base font-semibold tracking-tight">
          Faunetra
        </Link>
        {signedIn ? (
          <nav className="flex flex-wrap items-center gap-5">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
              >
                {link.label}
              </Link>
            ))}
            <SignOutButton />
          </nav>
        ) : (
          <nav className="flex items-center gap-5">
            <Link
              href="/impact"
              className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              Impact Fund
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
            >
              Sign in
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
