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

const GREEN = "#34C759";
const AMBER = "#F59E0B";
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
          if (passed) bg = GREEN;
          else if (current) bg = closed ? REJECTED_TONE : AMBER;
          return (
            <div
              key={s}
              title={s}
              style={{
                flex: 1,
                height,
                background: bg,
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
                color: i === curIdx ? "#1D1D1F" : "#AEAEB2",
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
