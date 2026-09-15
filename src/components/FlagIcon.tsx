import type { ComponentType } from "react";
import * as Flags from "country-flag-icons/react/3x2";

// Real SVG flags rather than Unicode flag emoji — Windows' font stack
// doesn't render flag emoji as flags at all (shows the raw two-letter code
// instead, e.g. "IN"), by design; macOS/iOS/Android do render them, but
// that's not a safe assumption for a general audience.
export function FlagIcon({ code, className }: { code: string; className?: string }) {
  const Flag = (Flags as Record<string, ComponentType<{ title?: string; className?: string }>>)[
    code.toUpperCase()
  ];
  if (!Flag) return null;
  return <Flag title={code} className={className ?? "h-4 w-auto rounded-[1px]"} />;
}
