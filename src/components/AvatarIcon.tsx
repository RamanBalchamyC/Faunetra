import type { AvatarId } from "@/lib/types";

export const AVATAR_OPTIONS: { id: AvatarId; label: string }[] = [
  { id: "octopus", label: "Octopus" },
  { id: "turtle", label: "Turtle" },
  { id: "seahorse", label: "Seahorse" },
  { id: "fish", label: "Fish" },
  { id: "crab", label: "Crab" },
  { id: "shrimp", label: "Shrimp" },
  { id: "jellyfish", label: "Jellyfish" },
  { id: "starfish", label: "Starfish" },
  { id: "seal", label: "Seal" },
];

// Flat, geometric, single-fill sea-creature glyphs — a fixed set (no
// upload) matching the logo's style. `currentColor` so callers tint via
// className; a wrapping circle is added by AvatarBadge, not here.
function Glyph({ id }: { id: AvatarId }) {
  switch (id) {
    case "octopus":
      return (
        <>
          <circle cx="16" cy="12" r="6" />
          <path
            d="M11 16 L8 24 M13.5 17 L11.5 25 M18.5 17 L20.5 25 M21 16 L24 24"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
    case "turtle":
      return (
        <>
          <ellipse cx="16" cy="16" rx="8" ry="6.5" />
          <circle cx="25" cy="14" r="2.5" />
          <path
            d="M10 21 L6 25 M11 23 L8 27 M21 23 L24 27 M22 21 L26 25"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <g stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" fill="none">
            <path d="M16 9.5 V22.5 M9 16 H23 M11 11 L21 21 M21 11 L11 21" />
          </g>
        </>
      );
    case "seahorse":
      return (
        <path
          d="M17 6 c3 0 4 2.5 4 5 c0 2.5 -2 3.5 -2 5.5 c0 1.5 2 1.5 2 3.5 c0 3 -3 5 -6 5 c-3 0 -4.5 -2 -4.5 -4 h2.5 c0 1 0.7 1.8 2 1.8 c1.6 0 3.3 -1 3.3 -2.6 c0 -1.2 -1.5 -1.4 -1.5 -3 c0 -2 2 -3 2 -5.2 c0 -1.6 -0.8 -2.6 -2 -2.6 c-1.1 0 -1.8 0.8 -1.8 1.8 h-2.3 c0 -2.6 2 -5.2 4.3 -5.2 z"
          fillRule="evenodd"
        />
      );
    case "fish":
      return (
        <>
          <ellipse cx="14" cy="16" rx="8" ry="5.5" />
          <path d="M22 16 L28 11 V21 Z" />
          <circle cx="10.5" cy="14.5" r="1.2" fill="var(--color-background, #fafaf8)" />
        </>
      );
    case "crab":
      return (
        <>
          <ellipse cx="16" cy="17" rx="7" ry="5" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="20" cy="12" r="1.6" />
          <path d="M12 12 L10 8 M20 12 L22 8" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <path
            d="M9 15 L3 12 M9 18 L3 20 M23 15 L29 12 M23 18 L29 20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
    case "shrimp":
      return (
        <path
          d="M8 20 c0 -6 4 -12 12 -12 c4 0 6 2 6 4 c0 1.5 -1.2 2 -2.4 2 c1 0.6 1.6 1.6 1.6 2.8 c0 1.4 -1 2.2 -2.2 2.2 c0.7 0.6 1 1.4 1 2.2 c0 1.8 -1.8 3 -4 3 c-6 0 -12 -1 -12 -4.2 z"
          fillRule="evenodd"
        />
      );
    case "jellyfish":
      return (
        <>
          <path d="M8 14 a8 7 0 0 1 16 0 c0 3 -3 4.5 -8 4.5 c-5 0 -8 -1.5 -8 -4.5 z" />
          <path
            d="M11 19 c0 3 -1 4 -1 6.5 M14.5 19.5 c0 3.5 1 4.5 1 7 M17.5 19.5 c0 3.5 -1 4.5 -1 7 M21 19 c0 3 1 4 1 6.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
    case "starfish":
      return (
        <path
          d="M16 4 L19 12.5 L28 12.5 L20.8 18 L23.5 26.5 L16 21.3 L8.5 26.5 L11.2 18 L4 12.5 L13 12.5 Z"
          strokeLinejoin="round"
        />
      );
    case "seal":
      return (
        <>
          <ellipse cx="15" cy="18" rx="9" ry="6" />
          <circle cx="22" cy="12" r="4.5" />
          <circle cx="23.5" cy="10.8" r="0.9" fill="var(--color-background, #fafaf8)" />
        </>
      );
  }
}

export function AvatarIcon({ avatarId, size = 24, className }: { avatarId: AvatarId; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" className={className}>
      <Glyph id={avatarId} />
    </svg>
  );
}

// Icon inside a circular tinted badge — the usual way avatars appear (nav,
// leaderboard rows, profile header).
export function AvatarBadge({ avatarId, size = 36 }: { avatarId: AvatarId; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
      style={{ width: size, height: size }}
    >
      <AvatarIcon avatarId={avatarId} size={Math.round(size * 0.62)} />
    </div>
  );
}
