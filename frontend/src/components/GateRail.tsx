import { STAGES, stageIndex } from "../lib/gates";
import type { IdeaStatus, Stage } from "../types";

interface GateRailProps {
  stage: Stage;
  status?: IdeaStatus;
  size?: "xs" | "sm" | "md";
  showLabels?: boolean;
}

const trackHeight: Record<NonNullable<GateRailProps["size"]>, number> = {
  xs: 4,
  sm: 6,
  md: 10,
};

const EMERALD = "#00F58A";
const CYAN = "#00B4D8";
const NEUTRAL = "#E5E5EA";
const REJECTED_TONE = "#C7C7CC";

export default function GateRail({ stage, status, size = "sm", showLabels = false }: GateRailProps) {
  const curIdx = stageIndex(stage);
  const height = trackHeight[size];
  const closed = status === "Rejeitada" || status === "Cancelada";
  const approvedFinal = status === "Aprovada" && curIdx === STAGES.length - 1;

  return (
    <div className="w-full">
      <div className="flex items-center" style={{ gap: size === "xs" ? 1.5 : 2 }}>
        {STAGES.map((s, i) => {
          const passed = i < curIdx || approvedFinal;
          const current = i === curIdx && !approvedFinal;
          let bg = NEUTRAL;
          if (passed) bg = EMERALD;
          else if (current) bg = closed ? REJECTED_TONE : CYAN;
          return (
            <div
              key={s}
              title={s}
              style={{
                flex: 1,
                height,
                background: bg,
                boxShadow: passed || current ? "inset 0 0 0 1px rgba(10,25,49,0.65)" : "none",
                borderTopLeftRadius: i === 0 ? height : 0,
                borderBottomLeftRadius: i === 0 ? height : 0,
                borderTopRightRadius: i === STAGES.length - 1 ? height : 0,
                borderBottomRightRadius: i === STAGES.length - 1 ? height : 0,
                transition: "background 0.2s ease",
              }}
            />
          );
        })}
      </div>
      {showLabels && (
        <div className="flex mt-1.5" style={{ gap: 2 }}>
          {STAGES.map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 9.5,
                lineHeight: 1.25,
                color: i === curIdx ? "#0A1931" : "#6E6E73",
                fontWeight: i === curIdx ? 600 : 400,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
