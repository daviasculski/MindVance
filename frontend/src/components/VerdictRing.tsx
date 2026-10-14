interface VerdictRingProps {
  score: number;
  max?: number;
  threshold?: number;
  size?: number;
  strokeWidth?: number;
}

export default function VerdictRing({
  score,
  max = 10,
  threshold = 7,
  size = 168,
  strokeWidth = 16,
}: VerdictRingProps) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, score / max));
  const passed = score >= threshold;
  const color = passed ? "#34C759" : "#F59E0B";

  const thresholdAngle = (threshold / max) * 360 - 90;
  const rad = (thresholdAngle * Math.PI) / 180;
  const notchOuter = r + strokeWidth / 2 + 4;
  const notchInner = r - strokeWidth / 2 - 4;
  const nx1 = cx + notchInner * Math.cos(rad);
  const ny1 = cy + notchInner * Math.sin(rad);
  const nx2 = cx + notchOuter * Math.cos(rad);
  const ny2 = cy + notchOuter * Math.sin(rad);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EDEDF0" strokeWidth={strokeWidth} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${pct * circumference} ${circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.4s ease, stroke 0.4s ease" }}
        />
        <line
          x1={nx1}
          y1={ny1}
          x2={nx2}
          y2={ny2}
          stroke="#1D1D1F"
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={0.55}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}
      >
        <div style={{ fontSize: size * 0.24, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", lineHeight: 1 }}>
          {score.toFixed(1)}
        </div>
        <div style={{ fontSize: size * 0.075, color: "#6E6E73", marginTop: 4 }}>
          de {max.toFixed(0)} · meta {threshold.toFixed(1)}
        </div>
      </div>
    </div>
  );
}
