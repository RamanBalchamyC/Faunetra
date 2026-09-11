// Faint, non-distracting node-network texture (echoes the logo's tentacle
// pattern) for screens that would otherwise feel flat/empty — currently
// just the login page. Absolutely positioned behind content; decorative
// only, so it's aria-hidden.
export function NetworkBackground() {
  const nodes = [
    [40, 60], [140, 40], [260, 90], [360, 50], [420, 140],
    [80, 180], [200, 210], [320, 220], [60, 300], [180, 330],
    [300, 320], [400, 300], [140, 120], [250, 160],
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 3], [3, 4], [1, 12], [12, 13], [13, 2], [2, 3],
    [0, 5], [5, 6], [6, 12], [6, 9], [9, 5], [6, 7], [7, 13], [7, 10],
    [9, 10], [10, 11], [7, 4], [5, 8],
  ];

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 460 380"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g stroke="var(--color-accent)" strokeOpacity="0.12" strokeWidth="1">
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />
        ))}
      </g>
      <g fill="var(--color-accent)" fillOpacity="0.18">
        {nodes.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3 : 2} />
        ))}
      </g>
    </svg>
  );
}
