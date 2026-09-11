// Brand mark — the real logo (public/logo/, generated from
// src/assets/logo/octopus.jpg by scripts/process-logo.mjs). Deep teal
// octopus with a lighter teal node-network pattern across the tentacles;
// transparent background so it composites onto any surface.
//
// The mark itself is a single teal fill — it has no separate "inverted"
// variant, so avoid placing it on a similarly-dark teal background (it
// disappears); use a light background behind it instead (see the FAB in
// AssistantWidget.tsx, which uses a white circle with a teal border rather
// than a solid teal fill for exactly this reason).
const SOURCE_SIZES = [32, 192, 512] as const;

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  const source = SOURCE_SIZES.find((s) => s >= size) ?? 512;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- fixed small local icon, next/image is unnecessary overhead here
    <img
      src={`/logo/octopus-${source}-transparent.png`}
      width={size}
      height={size}
      alt="Faunetra"
      className={className}
    />
  );
}
