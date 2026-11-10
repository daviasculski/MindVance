import type { IdeaStatus } from "../types";

const WAITING = { bg: "#F0F0F2", color: "#6E6E73" };
const IN_GATE = { bg: "rgba(0,180,216,0.12)", color: "#0A1931" };

const config: Record<IdeaStatus, { bg: string; color: string; label: string }> = {
  "Aguardando triagem": { ...WAITING, label: "Aguardando triagem" },
  "Aguardando designação": { ...IN_GATE, label: "Aguardando designação" },
  "Em avaliação": { ...IN_GATE, label: "Em avaliação" },
  "Aguardando decisão": { ...IN_GATE, label: "Aguardando decisão" },
  "Em andamento": {
    bg: "rgba(0,114,206,0.1)",
    color: "#0A1931",
    label: "Em andamento",
  },
  Aprovada: {
    bg: "rgba(0,245,138,0.18)",
    color: "#0A1931",
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
    bg: "rgba(0,180,216,0.12)",
    color: "#0A1931",
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
