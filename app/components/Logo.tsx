export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { icon: 16, text: 15, gap: 6 },
    md: { icon: 22, text: 20, gap: 8 },
    lg: { icon: 30, text: 28, gap: 10 },
  };
  const s = sizes[size];
  const bars = [3, 7, 11, 7, 3];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: s.gap, userSelect: "none" }}>
      <svg width={s.icon} height={s.icon} viewBox="0 0 22 22" fill="none">
        {bars.map((h, i) => (
          <rect
            key={i}
            x={i * 4 + 1} y={(22 - h) / 2}
            width={3} height={h} rx={1.5}
            fill={i === 2 ? "var(--color-accent)" : "var(--color-text-1)"}
            opacity={i === 2 ? 1 : 0.75}
          />
        ))}
      </svg>
      <span style={{
        fontFamily: "var(--font-dm-serif), 'DM Serif Display', serif",
        fontSize: s.text, fontWeight: 400,
        color: "var(--color-text-1)",
        letterSpacing: "-0.01em", lineHeight: 1,
      }}>
        detto
      </span>
    </div>
  );
}
