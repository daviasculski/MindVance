import { ArrowLeft, FileText, Image, Layers, CheckCircle2, XCircle, RotateCcw, Clock, AlertTriangle, Quote } from "lucide-react";
import type { Idea } from "../types";
import GateBadge from "../components/GateBadge";
import StatusBadge from "../components/StatusBadge";
import DeptTag from "../components/DeptTag";
import GateRail from "../components/GateRail";
import GateAgingBadge from "../components/GateAgingBadge";
import { rejectionFeedback } from "../lib/ideaVisuals";
import { gateForStage } from "../lib/gates";

interface IdeaDetailProps {
  idea: Idea;
  onBack: () => void;
}

export default function IdeaDetail({ idea, onBack }: IdeaDetailProps) {
  const gate = gateForStage(idea.stage);
  const feedback = rejectionFeedback(idea);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#F5F5F7" }}>
      {/* Top bar */}
      <div
        className="px-8 py-4 flex items-center gap-4 flex-shrink-0 sticky top-0 z-10"
        style={{ borderBottom: "1px solid #E5E5EA", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 transition-colors"
          style={{
            color: "#6E6E73",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <div style={{ width: 1, height: 20, background: "#E5E5EA" }} />
        <GateBadge label={gate ? `Gate ${gate.n} — ${idea.stage}` : idea.stage} size="sm" />
        <StatusBadge status={idea.status} />
        <GateAgingBadge idea={idea} />
      </div>

      <div className="px-8 py-6 max-w-5xl mx-auto">
        <div className="grid gap-8" style={{ gridTemplateColumns: "1fr 340px" }}>
          {/* Main content */}
          <div>
            <h1
              style={{
                fontWeight: 700,
                fontSize: 26,
                color: "#1D1D1F",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                marginBottom: 8,
              }}
            >
              {idea.title}
            </h1>

            <div className="flex items-center gap-3 mb-8">
              <span style={{ color: "#AEAEB2", fontSize: 13 }}>
                por {idea.author}
              </span>
              {idea.department && <DeptTag name={idea.department} />}
              <span style={{ color: "#AEAEB2", fontSize: 13 }}>
                {new Date(idea.submittedAt).toLocaleDateString("pt-BR")}
              </span>
            </div>

            {idea.status === "Rejeitada" && feedback && (
              <div
                className="p-5 mb-8 rounded-2xl"
                style={{ background: "#FAFAFA" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Quote size={14} style={{ color: "#AEAEB2" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93" }}>
                    ENCERRADA NESTA ETAPA — JUSTIFICATIVA
                  </span>
                </div>
                <p style={{ color: "#6E6E73", fontSize: 13.5, lineHeight: 1.65 }}>
                  {feedback}
                </p>
              </div>
            )}

            {/* Stage progress */}
            <div
              className="p-5 mb-8 rounded-2xl card-soft"
              style={{ background: "#FFFFFF" }}
            >
              <div style={{ color: "#AEAEB2", fontSize: 11, fontWeight: 600, marginBottom: 18 }}>
                PROGRESSO NO FUNIL
              </div>
              <GateRail stage={idea.stage} status={idea.status} size="md" showLabels />
            </div>

            {/* Content sections */}
            <Section title="Problema Identificado">{idea.problem}</Section>
            <Section title="Solução Proposta">{idea.solution}</Section>
            <Section title="Impacto Estimado">{idea.impact}</Section>
            <Section title="Recursos Necessários">{idea.resources}</Section>

            {/* Attachments */}
            {idea.attachments.length > 0 && (
              <div className="mt-6">
                <div
                  style={{
                    color: "#6E6E73",
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  Anexos ({idea.attachments.length})
                </div>
                <div className="flex flex-col gap-2">
                  {idea.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 card-soft"
                      style={{ background: "#FFFFFF" }}
                    >
                      {att.type === "image" ? (
                        <Image size={16} style={{ color: "#3B82F6" }} />
                      ) : att.type === "prototype" ? (
                        <Layers size={16} style={{ color: "#8B7CF6" }} />
                      ) : (
                        <FileText size={16} style={{ color: "#2DD4BF" }} />
                      )}
                      <div>
                        <div style={{ color: "#1D1D1F", fontSize: 13 }}>
                          {att.name}
                        </div>
                        <div style={{ color: "#AEAEB2", fontSize: 11 }}>{att.size}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div>
            <div
              className="rounded-2xl p-5 sticky top-20 card-soft"
              style={{ background: "#FFFFFF" }}
            >
              <div
                style={{
                  color: "#AEAEB2",
                  fontSize: 11,
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                HISTÓRICO DE MOVIMENTAÇÕES
              </div>
              <div className="flex flex-col gap-0">
                {idea.timeline.length === 0 ? (
                  <div style={{ color: "#AEAEB2", fontSize: 13 }}>
                    Nenhuma movimentação registrada.
                  </div>
                ) : (
                  idea.timeline.map((entry, i) => {
                    const isLast = i === idea.timeline.length - 1;
                    return (
                      <div key={entry.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className="flex items-center justify-center flex-shrink-0 rounded-full"
                            style={{
                              width: 28,
                              height: 28,
                              background:
                                entry.decision === "aprovada"
                                  ? "rgba(52,199,89,0.12)"
                                  : entry.decision === "rejeitada"
                                  ? "#F0F0F2"
                                  : entry.decision === "revisão"
                                  ? "rgba(245,158,11,0.12)"
                                  : "rgba(59,130,246,0.12)",
                            }}
                          >
                            {entry.decision === "aprovada" ? (
                              <CheckCircle2 size={13} style={{ color: "#34C759" }} />
                            ) : entry.decision === "rejeitada" ? (
                              <XCircle size={13} style={{ color: "#8E8E93" }} />
                            ) : entry.decision === "revisão" ? (
                              <RotateCcw size={13} style={{ color: "#F59E0B" }} />
                            ) : (
                              <Clock size={13} style={{ color: "#3B82F6" }} />
                            )}
                          </div>
                          {!isLast && (
                            <div style={{ width: 1, flex: 1, background: "#E5E5EA", minHeight: 16, margin: "2px 0" }} />
                          )}
                        </div>
                        <div className="pb-4">
                          <div style={{ color: "#B6790A", fontSize: 10, fontWeight: 600, letterSpacing: "0.03em" }}>
                            {entry.stage.toUpperCase()}
                          </div>
                          <div style={{ color: "#1D1D1F", fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>
                            {entry.decision === "submetida"
                              ? "Submetida"
                              : entry.decision === "aprovada"
                              ? "Aprovada"
                              : entry.decision === "rejeitada"
                              ? "Encerrada"
                              : "Enviada para revisão"}
                          </div>
                          <div style={{ color: "#AEAEB2", fontSize: 11, marginTop: 1 }}>
                            {new Date(entry.date).toLocaleDateString("pt-BR")} · {entry.responsible}
                          </div>
                          <p style={{ color: "#6E6E73", fontSize: 12, marginTop: 5, lineHeight: 1.55 }}>
                            {entry.feedback}
                          </p>
                          {entry.reviewPoints && entry.reviewPoints.length > 0 && (
                            <div
                              className="mt-3 rounded-xl p-3"
                              style={{ background: "rgba(245,158,11,0.07)" }}
                            >
                              <div className="flex items-center gap-1.5 mb-2" style={{ color: "#B6790A", fontSize: 11, fontWeight: 600 }}>
                                <AlertTriangle size={11} />
                                Pontos a revisar
                              </div>
                              <ul className="flex flex-col gap-1">
                                {entry.reviewPoints.map((p, j) => (
                                  <li key={j} style={{ color: "#1D1D1F", fontSize: 11, lineHeight: 1.5 }}>
                                    · {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div
        style={{
          color: "#6E6E73",
          fontSize: 11.5,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {children ? (
        <p style={{ color: "#1D1D1F", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {children}
        </p>
      ) : (
        <p style={{ color: "#AEAEB2", fontSize: 13.5, fontStyle: "italic" }}>Não informado</p>
      )}
    </div>
  );
}
