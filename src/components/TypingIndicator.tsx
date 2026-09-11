// Node-and-line "typing" indicator — three nodes on a thin connecting line,
// pulsing in sequence, echoing the logo's network motif instead of a
// generic spinner.
export function TypingIndicator() {
  return (
    <svg width="48" height="14" viewBox="0 0 48 14" aria-label="Assistant is typing">
      <line x1="7" y1="7" x2="41" y2="7" stroke="var(--color-border)" strokeWidth="1.5" />
      {[7, 24, 41].map((cx, i) => (
        <circle
          key={cx}
          cx={cx}
          cy={7}
          r="4"
          fill="var(--color-accent)"
          className="node-typing-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </svg>
  );
}
