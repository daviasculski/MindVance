import type { IdeaStatus } from "../types";

const config: Record<IdeaStatus, { bg: string; color: string; label: string }> = {
  "Em andamento": {
    bg: "rgba(59,130,246,0.1)",
    color: "#2563EB",
    label: "Em andamento",
  },
  Aprovada: {
    bg: "rgba(52,199,89,0.12)",
    color: "#1F8A3B",
    label: "Aprovada",
  },
  Rejeitada: {
    // Dignified, restrained treatment — a killed idea is the funnel working
    // as intended, not a failure, so this deliberately avoids punitive red.
    bg: "#F0F0F2",
    color: "#6E6E73",
    label: "Encerrada nesta etapa",
  },
  "Em revisão": {
    bg: "rgba(245,158,11,0.12)",
    color: "#B6790A",
    label: "Em revisão",
  },
};

export default function StatusBadge({ status }: { status: IdeaStatus }) {
  const c = config[status];
  return (
    <span
      className="inline-flex items-center rounded-full text-xs font-medium"
      style={{
        background: c.bg,
        color: c.color,
        padding: "3px 10px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      }}
    >
      {c.label}
    </span>
  );
}
