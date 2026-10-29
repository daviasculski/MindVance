import type { IdeaStatus } from "../types";

const WAITING = { bg: "#F0F0F2", color: "#6E6E73" };
const IN_GATE = { bg: "rgba(139,124,246,0.12)", color: "#6D5CD6" };

const config: Record<IdeaStatus, { bg: string; color: string; label: string }> = {
  "Aguardando triagem": { ...WAITING, label: "Aguardando triagem" },
  "Aguardando designação": { ...IN_GATE, label: "Aguardando designação" },
  "Em avaliação": { ...IN_GATE, label: "Em avaliação" },
  "Aguardando decisão": { ...IN_GATE, label: "Aguardando decisão" },
  "Em andamento": {
    bg: "rgba(59,130,246,0.1)",
    color: "#2563EB",
    label: "Em andamento",
  },
  Aprovada: {
    bg: "rgba(52,199,89,0.12)",
    color: "#1F8A3B",
    label: "Aprovada para lançamento",
  },
  Rejeitada: {
    // Dignified, restrained treatment — a killed idea is the funnel working
    // as intended, not a failure, so this deliberately avoids punitive red.
    bg: "#F0F0F2",
    color: "#6E6E73",
    label: "Encerrada nesta etapa",
  },
  Cancelada: {
    bg: "#F0F0F2",
    color: "#6E6E73",
    label: "Cancelada",
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
        whiteSpace: "nowrap",
      }}
    >
      {c.label}
    </span>
  );
}
