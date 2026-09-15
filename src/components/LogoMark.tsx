// Brand mark — public/logo/octopus.svg, vector-traced from the source
// artwork (scripts/vectorize-logo.mjs) so it stays crisp at any zoom level,
// unlike the earlier PNG-only version. Single flat teal fill; place on a
// light background (it has no separate light/dark variant — see the FAB in
// AssistantWidget.tsx, which uses a white circle + teal border rather than
// a solid teal fill for exactly this reason).
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG icon, next/image adds no value here
    <img src="/logo/octopus.svg" width={size} height={size} alt="Faunetra" className={className} />
  );
}
