// Circular progress indicator built from the logo's node-network motif:
// nodes arranged in a ring, connected by thin lines, filling in (accent →
// primary) as `value`/`max` climbs. Used for contribution score, which has
// a natural cap (see MAX_CONTRIBUTION_SCORE in MiningHub) so a fixed ring
// makes sense even though session duration itself is open-ended.
export function NodeRing({ value, max, size = 160 }: { value: number; max: number; size?: number }) {
  const center = size / 2;
  const radius = size / 2 - 14;
  const nodeCount = max;
  const filled = Math.max(0, Math.min(Math.round(value), max));

  const points = Array.from({ length: nodeCount }, (_, i) => {
    const angle = (i / nodeCount) * Math.PI * 2 - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      isFilled: i < filled,
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-border)" strokeWidth="1" />
      {points.map((p, i) => {
        const next = points[(i + 1) % points.length];
        return (
          <line
            key={`line-${i}`}
            x1={p.x}
            y1={p.y}
            x2={next.x}
            y2={next.y}
            stroke={p.isFilled && next.isFilled ? "var(--color-accent)" : "var(--color-border)"}
            strokeWidth="1"
          />
        );
      })}
      {points.map((p, i) => (
        <circle
          key={`node-${i}`}
          cx={p.x}
          cy={p.y}
          r={p.isFilled ? 5 : 3.5}
          fill={p.isFilled ? "var(--color-accent)" : "var(--color-surface)"}
          stroke={p.isFilled ? "var(--color-accent)" : "var(--color-border)"}
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}
