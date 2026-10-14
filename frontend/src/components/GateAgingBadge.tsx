import { Clock } from "lucide-react";
import type { Idea } from "../types";
import { agingTone, daysWaiting, isAwaitingGate } from "../lib/ideaVisuals";

export default function GateAgingBadge({ idea }: { idea: Idea }) {
  if (!isAwaitingGate(idea)) return null;
  const days = daysWaiting(idea);
  const tone = agingTone(days);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full"
      style={{
        background: tone.bg,
        color: tone.color,
        fontSize: 10.5,
        fontWeight: 600,
        padding: "2px 8px",
      }}
      title={`Aguardando decisão de gate há ${days} dia${days === 1 ? "" : "s"}`}
    >
      <Clock size={10} />
      {tone.label}
    </span>
  );
}
