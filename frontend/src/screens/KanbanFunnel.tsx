import { useState } from "react";
import { Filter, ChevronDown, Quote } from "lucide-react";
import { ideas, departments, kpiData } from "../data";
import type { Stage, Idea } from "../types";
import StatusBadge from "../components/StatusBadge";
import DeptTag from "../components/DeptTag";
import GateRail from "../components/GateRail";
import GateAgingBadge from "../components/GateAgingBadge";
import { presenceForIdea, rejectionFeedback } from "../lib/ideaVisuals";
import { STAGES } from "../lib/gates";

const stages: Stage[] = STAGES;

const stageShort: Record<Stage, string> = {
  "Ideação": "Ideação",
  "Escopo": "Escopo",
  "Plano de Negócios": "Plano",
  "Desenvolvimento": "Dev",
  "Teste e Validação": "T&V",
  "Lançamento": "Lançamento",
};

// Real funnel: columns physically narrow toward later stages.
const columnWidth = [252, 232, 212, 196, 180, 164];

interface KanbanFunnelProps {
  onOpenIdea: (id: string) => void;
}

export default function KanbanFunnel({ onOpenIdea }: KanbanFunnelProps) {
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = ideas.filter((i) => {
    if (filterDept !== "all" && i.department !== filterDept) return false;
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    return true;
  });

  const byStage = (stage: Stage) => filtered.filter((i) => i.stage === stage);
  const survival = kpiData.funnelConversion.map((r) => r.count).join(" → ");

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F5F5F7" }}>
      {/* Header */}
      <div
        className="px-8 py-5 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "1px solid #E5E5EA", background: "#FFFFFF" }}
      >
        <div>
          <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
            Painel do Funil
          </h1>
          <p style={{ color: "#6E6E73", fontSize: 13, marginTop: 3 }}>
            {filtered.length} ideia{filtered.length !== 1 ? "s" : ""} no funil ·{" "}
            <span style={{ color: "#AEAEB2" }}>histórico: {survival}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 transition-all"
            style={{
              background: filterOpen ? "#F5F5F7" : "#FFFFFF",
              border: "1px solid #E5E5EA",
              color: "#6E6E73",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <Filter size={14} />
            Filtros
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {filterOpen && (
        <div
          className="px-8 py-4 flex items-center gap-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #E5E5EA", background: "#FFFFFF" }}
        >
          <div className="flex items-center gap-2">
            <label style={{ color: "#AEAEB2", fontSize: 12 }}>Área:</label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              style={selStyle}
            >
              <option value="all">Todas</option>
              {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label style={{ color: "#AEAEB2", fontSize: 12 }}>Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={selStyle}
            >
              <option value="all">Todos</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Aprovada">Aprovada</option>
              <option value="Rejeitada">Rejeitada</option>
              <option value="Em revisão">Em revisão</option>
            </select>
          </div>
          {(filterDept !== "all" || filterStatus !== "all") && (
            <button
              onClick={() => { setFilterDept("all"); setFilterStatus("all"); }}
              style={{ color: "#F59E0B", fontSize: 12, background: "none", border: "none", cursor: "pointer" }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-0 h-full items-start" style={{ minWidth: "max-content" }}>
          {stages.map((stage, idx) => {
            const cards = byStage(stage);

            return (
              <div
                key={stage}
                className="flex flex-col h-full"
                style={{
                  width: columnWidth[idx],
                  flexShrink: 0,
                  borderRight: idx < stages.length - 1 ? "1px solid #E5E5EA" : "none",
                }}
              >
                {/* Column header */}
                <div className="px-3 py-3 flex-shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#B6790A", letterSpacing: "0.02em" }}>
                      GATE {idx + 1}
                    </div>
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{
                        minWidth: 20,
                        height: 20,
                        padding: "0 6px",
                        background: cards.length > 0 ? "rgba(245,158,11,0.12)" : "#F0F0F2",
                        color: cards.length > 0 ? "#B6790A" : "#AEAEB2",
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    >
                      {cards.length}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: "#1D1D1F" }}>
                    {stageShort[stage]}
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto px-2.5 pb-3 flex flex-col gap-2.5">
                  {cards.length === 0 ? (
                    <div
                      className="flex items-center justify-center rounded-2xl py-8"
                      style={{ border: "1.5px dashed #E5E5EA", color: "#AEAEB2", fontSize: 12 }}
                    >
                      Nenhuma ideia
                    </div>
                  ) : (
                    cards.map((idea) => <IdeaCard key={idea.id} idea={idea} onClick={() => onOpenIdea(idea.id)} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function IdeaCard({ idea, onClick }: { idea: Idea; onClick: () => void }) {
  const rejected = idea.status === "Rejeitada";
  const feedback = rejectionFeedback(idea);
  const presence = presenceForIdea(idea);

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3.5 rounded-2xl transition-transform"
      style={{
        ...presence,
        background: rejected ? "#FAFAFA" : presence.background,
        cursor: "pointer",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div
          style={{
            fontWeight: 600,
            fontSize: 12.5,
            color: rejected ? "#6E6E73" : "#1D1D1F",
            lineHeight: 1.4,
          }}
        >
          {idea.title}
        </div>
        <GateAgingBadge idea={idea} />
      </div>
      <div style={{ fontSize: 11, color: "#AEAEB2", marginBottom: 8 }}>
        {idea.author}
      </div>
      <div className="flex items-center gap-1 flex-wrap mb-2">
        <DeptTag name={idea.department} />
      </div>

      {rejected && feedback && (
        <div
          className="flex items-start gap-1.5 mb-2 rounded-xl px-2.5 py-2"
          style={{ background: "#F5F5F7" }}
        >
          <Quote size={11} style={{ color: "#AEAEB2", flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 10.5, color: "#8E8E93", lineHeight: 1.4 }}>
            {feedback.length > 90 ? feedback.slice(0, 90) + "…" : feedback}
          </p>
        </div>
      )}

      <div className="mb-2.5">
        <StatusBadge status={idea.status} />
      </div>

      <GateRail stage={idea.stage} status={idea.status} size="xs" />
    </button>
  );
}

const selStyle: React.CSSProperties = {
  background: "#F5F5F7",
  border: "none",
  borderRadius: 8,
  color: "#1D1D1F",
  fontSize: 12,
  padding: "5px 8px",
  outline: "none",
  appearance: "none",
};
