import { recommend, type GateThresholds } from "../lib/gateReviews";

interface VerdictRingProps extends GateThresholds {
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
}

// Mesma regra do backend: aprovar (verde), revisar (âmbar), rejeitar (cinza, sem vermelho punitivo)
const colorByRecommendation = {
  aprovada: "#34C759",
  "revisão": "#F59E0B",
  rejeitada: "#AEAEB2",
} as const;

export default function VerdictRing({
  score,
  approveThreshold,
  reviseThreshold,
  max = 10,
  size = 168,
  strokeWidth = 16,
}: VerdictRingProps) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, score / max));
  const color = colorByRecommendation[recommend(score, { approveThreshold, reviseThreshold })];

  // Marcadores nos limites de aprovar e de revisar
  function notch(threshold: number) {
    const rad = (((threshold / max) * 360 - 90) * Math.PI) / 180;
    const outer = r + strokeWidth / 2 + 4;
    const inner = r - strokeWidth / 2 - 4;
    return {
      x1: cx + inner * Math.cos(rad),
      y1: cy + inner * Math.sin(rad),
      x2: cx + outer * Math.cos(rad),
      y2: cy + outer * Math.sin(rad),
    };
  }

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
        {[
          { t: approveThreshold, opacity: 0.55 },
          { t: reviseThreshold, opacity: 0.25 },
        ].map(({ t, opacity }) => {
          const n = notch(t);
          return (
            <line
              key={t}
              {...n}
              stroke="#1D1D1F"
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={opacity}
            />
          );
        })}
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}
      >
        <div style={{ fontSize: size * 0.24, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", lineHeight: 1 }}>
          {/* Até 2 casas, como o backend: 6,95 não pode aparecer como "7,0" e recomendar Revisar */}
          {score.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: size * 0.075, color: "#6E6E73", marginTop: 4 }}>
          de {max.toFixed(0)} · meta {approveThreshold.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
        </div>
      </div>
    </div>
  );
}
