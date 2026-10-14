import { ideas } from "../data";
import { Trophy, Calendar, Rocket } from "lucide-react";
import type { Idea } from "../types";
import DeptTag from "../components/DeptTag";
import GateRail from "../components/GateRail";
import { presenceForIdea } from "../lib/ideaVisuals";

interface ApprovedBoardProps {
  onOpenIdea: (id: string) => void;
}

export default function ApprovedBoard({ onOpenIdea }: ApprovedBoardProps) {
  const approvedIdeas = ideas.filter((i) => i.status === "Aprovada");
  const launchedOthers = ideas.filter((i) => i.stage === "Lançamento" && i.status !== "Aprovada");

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: "#F5F5F7" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Trophy size={22} style={{ color: "#F59E0B" }} />
            <h1
              style={{
                fontWeight: 700,
                fontSize: 24,
                color: "#1D1D1F",
                letterSpacing: "-0.02em",
              }}
            >
              Mural de Ideias Aprovadas
            </h1>
          </div>
          <p style={{ color: "#6E6E73", fontSize: 13 }}>
            Iniciativas aprovadas no funil de inovação — {approvedIdeas.length} ideia{approvedIdeas.length !== 1 ? "s" : ""}
          </p>
        </div>

        {approvedIdeas.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {approvedIdeas.map((idea) => (
              <IdeaShowcaseCard key={idea.id} idea={idea} accent="#34C759" onClick={() => onOpenIdea(idea.id)} />
            ))}
            {launchedOthers.map((idea) => (
              <IdeaShowcaseCard key={idea.id} idea={idea} accent="#3B82F6" onClick={() => onOpenIdea(idea.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IdeaShowcaseCard({ idea, accent, onClick }: { idea: Idea; accent: string; onClick: () => void }) {
  const presence = presenceForIdea(idea);
  return (
    <button
      onClick={onClick}
      className="text-left p-5 rounded-2xl transition-transform"
      style={{ ...presence, borderTop: `3px solid ${accent}`, cursor: "pointer" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <DeptTag name={idea.department} />
      </div>

      <h3
        style={{
          fontWeight: 700,
          fontSize: 15,
          color: "#1D1D1F",
          lineHeight: 1.3,
          marginBottom: 8,
        }}
      >
        {idea.title}
      </h3>

      <p
        style={{
          color: "#6E6E73",
          fontSize: 12,
          lineHeight: 1.6,
          marginBottom: 14,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {idea.solution}
      </p>

      <div className="mb-3">
        <GateRail stage={idea.stage} status={idea.status} size="xs" />
      </div>

      <div
        style={{
          borderTop: "1px solid #F0F0F2",
          paddingTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div className="flex items-center gap-2" style={{ color: "#AEAEB2", fontSize: 11 }}>
          <Rocket size={11} style={{ color: accent }} />
          por {idea.author}
        </div>
        <div className="flex items-center gap-2" style={{ color: "#AEAEB2", fontSize: 11 }}>
          <Calendar size={11} />
          {new Date(idea.submittedAt).toLocaleDateString("pt-BR")}
        </div>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div
      className="p-16 text-center rounded-2xl"
      style={{ background: "#FFFFFF", border: "1.5px dashed #E5E5EA" }}
    >
      <Trophy size={40} style={{ color: "#E5E5EA", margin: "0 auto 16px" }} />
      <div style={{ color: "#6E6E73", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
        Nenhuma ideia aprovada ainda
      </div>
      <p style={{ color: "#AEAEB2", fontSize: 13 }}>
        Assim que ideias forem aprovadas no funil Stage-Gate, elas aparecerão aqui.
      </p>
    </div>
  );
}
