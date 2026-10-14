import { useState } from "react";
import { Clock, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import { evaluations, ideas } from "../data";
import type { Evaluation, EvaluationCriteria } from "../types";
import GateBadge from "../components/GateBadge";
import GateRail from "../components/GateRail";
import GateAgingBadge from "../components/GateAgingBadge";
import VerdictRing from "../components/VerdictRing";
import WeightedSlider from "../components/WeightedSlider";

const PASS_THRESHOLD = 7;

export default function GateEvaluation() {
  const [selected, setSelected] = useState<string | null>(null);
  const [evals, setEvals] = useState<Evaluation[]>(evaluations);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [justError, setJustError] = useState(false);

  const active = evals.find((e) => e.id === selected);
  const activeIdea = active ? ideas.find((i) => i.id === active.ideaId) : undefined;

  function updateScore(evalId: string, critId: string, score: number) {
    setEvals((prev) =>
      prev.map((e) => {
        if (e.id !== evalId) return e;
        const criteria = e.criteria.map((c) =>
          c.id === critId ? { ...c, score } : c
        );
        const total = criteria.reduce((acc, c) => acc + (c.score * c.weight) / 100, 0);
        return { ...e, criteria, totalScore: Math.round(total * 10) / 10 };
      })
    );
  }

  function updateComment(evalId: string, critId: string, comment: string) {
    setEvals((prev) =>
      prev.map((e) => {
        if (e.id !== evalId) return e;
        return { ...e, criteria: e.criteria.map((c) => c.id === critId ? { ...c, comment } : c) };
      })
    );
  }

  function updateJustification(evalId: string, justification: string) {
    setEvals((prev) => prev.map((e) => e.id === evalId ? { ...e, justification } : e));
    setJustError(false);
  }

  function handleSubmit() {
    if (!active) return;
    if (!active.justification.trim()) { setJustError(true); return; }
    setEvals((prev) =>
      prev.map((e) => e.id === active.id ? { ...e, completed: true } : e)
    );
    setSubmitted(active.id);
    setSelected(null);
  }

  const pending = evals.filter((e) => !e.completed);
  const done = evals.filter((e) => e.completed);

  if (selected && active) {
    return (
      <div className="flex-1 overflow-y-auto" style={{ background: "#F5F5F7" }}>
        <div
          className="px-8 py-4 flex items-center gap-4 sticky top-0 z-10"
          style={{ borderBottom: "1px solid #E5E5EA", background: "rgba(245,245,247,0.9)", backdropFilter: "blur(8px)" }}
        >
          <button
            onClick={() => setSelected(null)}
            style={{
              color: "#6E6E73",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ← Voltar à fila
          </button>
          <div style={{ width: 1, height: 20, background: "#E5E5EA" }} />
          <GateBadge label={active.gate} size="sm" />
          <div style={{ color: "#8E8E93", fontSize: 12, marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={12} />
            Prazo: {new Date(active.deadline).toLocaleDateString("pt-BR")}
          </div>
        </div>

        <div className="px-8 py-6 max-w-4xl mx-auto">
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#1D1D1F", letterSpacing: "-0.02em", marginBottom: 4 }}>
            {active.ideaTitle}
          </h2>
          <p style={{ color: "#6E6E73", fontSize: 13, marginBottom: 8 }}>
            Ajuste cada critério com o peso correspondente. O anel de veredito reage em tempo real.
          </p>
          {activeIdea && (
            <div className="mb-8">
              <GateRail stage={activeIdea.stage} status={activeIdea.status} size="sm" showLabels />
            </div>
          )}

          <div className="grid gap-8 mb-8" style={{ gridTemplateColumns: "1fr 220px" }}>
            {/* Criteria */}
            <div className="flex flex-col gap-5">
              {active.criteria.map((c) => (
                <CriteriaRow
                  key={c.id}
                  criteria={c}
                  onScoreChange={(score) => updateScore(active.id, c.id, score)}
                  onCommentChange={(comment) => updateComment(active.id, c.id, comment)}
                />
              ))}
            </div>

            {/* Verdict ring — hero moment */}
            <div className="flex flex-col items-center">
              <div
                className="p-5 rounded-2xl card-elevated flex flex-col items-center sticky top-24"
                style={{ background: "#FFFFFF" }}
              >
                <div style={{ color: "#AEAEB2", fontSize: 10.5, fontWeight: 600, marginBottom: 12 }}>
                  VEREDITO PONDERADO
                </div>
                <VerdictRing score={active.totalScore} threshold={PASS_THRESHOLD} size={148} strokeWidth={14} />
                <div
                  className="mt-3 rounded-full"
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "4px 12px",
                    background: active.totalScore >= PASS_THRESHOLD ? "rgba(52,199,89,0.12)" : "rgba(245,158,11,0.12)",
                    color: active.totalScore >= PASS_THRESHOLD ? "#1F8A3B" : "#B6790A",
                  }}
                >
                  {active.totalScore >= PASS_THRESHOLD ? "Acima da meta" : "Abaixo da meta"}
                </div>
              </div>
            </div>
          </div>

          {/* Justification */}
          <div className="mb-6">
            <label style={{ color: "#1D1D1F", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
              Justificativa geral <span style={{ color: "#FF3B30" }}>*</span>
            </label>
            <textarea
              value={active.justification}
              onChange={(e) => updateJustification(active.id, e.target.value)}
              placeholder="Justifique sua avaliação geral desta ideia para este gate..."
              rows={4}
              style={{
                width: "100%",
                background: "#FFFFFF",
                border: `1.5px solid ${justError ? "#FF3B30" : "transparent"}`,
                borderRadius: 14,
                color: "#1D1D1F",
                fontSize: 13.5,
                padding: "12px 14px",
                outline: "none",
                resize: "vertical",
              }}
              className="card-soft"
            />
            {justError && (
              <div className="flex items-center gap-1.5 mt-2" style={{ color: "#FF3B30", fontSize: 12 }}>
                <AlertCircle size={12} />
                Justificativa obrigatória antes de confirmar o envio
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-xl font-semibold"
            style={{
              background: "#F59E0B",
              color: "#FFFFFF",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            Confirmar Avaliação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: "#F5F5F7" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 style={{ fontWeight: 700, fontSize: 24, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
            Fila de Avaliações
          </h1>
          <p style={{ color: "#6E6E73", fontSize: 13, marginTop: 4 }}>
            {pending.length} avaliação{pending.length !== 1 ? "ões" : ""} pendente{pending.length !== 1 ? "s" : ""}
          </p>
        </div>

        {submitted && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-center gap-3"
            style={{ background: "rgba(52,199,89,0.1)" }}
          >
            <CheckCircle2 size={18} style={{ color: "#34C759" }} />
            <span style={{ color: "#1F8A3B", fontSize: 13 }}>
              Avaliação enviada com sucesso.
            </span>
          </div>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <div className="mb-8">
            <div style={{ color: "#AEAEB2", fontSize: 11, fontWeight: 600, marginBottom: 10 }}>
              PENDENTES
            </div>
            <div className="flex flex-col gap-3">
              {pending.map((e) => (
                <EvalCard key={e.id} ev={e} onClick={() => setSelected(e.id)} />
              ))}
            </div>
          </div>
        )}

        {pending.length === 0 && done.length === 0 && (
          <EmptyState />
        )}

        {/* Done */}
        {done.length > 0 && (
          <div>
            <div style={{ color: "#AEAEB2", fontSize: 11, fontWeight: 600, marginBottom: 10 }}>
              CONCLUÍDAS
            </div>
            <div className="flex flex-col gap-3">
              {done.map((e) => (
                <EvalCard key={e.id} ev={e} onClick={() => {}} done />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CriteriaRow({
  criteria,
  onScoreChange,
  onCommentChange,
}: {
  criteria: EvaluationCriteria;
  onScoreChange: (s: number) => void;
  onCommentChange: (c: string) => void;
}) {
  return (
    <div
      className="rounded-2xl p-5 card-soft"
      style={{ background: "#FFFFFF" }}
    >
      <WeightedSlider
        label={criteria.name}
        weight={criteria.weight}
        value={criteria.score}
        onChange={onScoreChange}
      />
      <textarea
        value={criteria.comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder="Comentário para este critério..."
        rows={2}
        className="mt-4"
        style={{
          width: "100%",
          background: "#F5F5F7",
          border: "none",
          borderRadius: 10,
          color: "#1D1D1F",
          fontSize: 12.5,
          padding: "9px 11px",
          outline: "none",
          resize: "none",
        }}
      />
    </div>
  );
}

function EvalCard({ ev, onClick, done }: { ev: Evaluation; onClick: () => void; done?: boolean }) {
  const daysLeft = Math.ceil(
    (new Date(ev.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const idea = ideas.find((i) => i.id === ev.ideaId);
  return (
    <button
      onClick={onClick}
      disabled={done}
      className="w-full text-left rounded-2xl p-5 transition-all card-soft"
      style={{
        background: "#FFFFFF",
        cursor: done ? "default" : "pointer",
        opacity: done ? 0.75 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <GateBadge label={ev.gate} size="sm" />
            {idea && !done && <GateAgingBadge idea={idea} />}
            {done && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#1F8A3B", fontSize: 11 }}>
                <CheckCircle2 size={12} />
                Concluída
              </span>
            )}
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#1D1D1F", marginBottom: 6 }}>
            {ev.ideaTitle}
          </div>
          {idea && (
            <div className="mb-2.5" style={{ maxWidth: 320 }}>
              <GateRail stage={idea.stage} status={idea.status} size="xs" />
            </div>
          )}
          {done && (
            <div style={{ color: "#AEAEB2", fontSize: 12 }}>
              Nota enviada: <span style={{ color: "#B6790A", fontWeight: 600 }}>{ev.totalScore.toFixed(1)}/10</span>
            </div>
          )}
          {!done && (
            <div
              className="flex items-center gap-1"
              style={{
                color: daysLeft < 3 ? "#FF3B30" : "#6E6E73",
                fontSize: 12,
              }}
            >
              <Clock size={12} />
              {daysLeft > 0 ? `${daysLeft} dias restantes` : "Prazo vencido"} · {new Date(ev.deadline).toLocaleDateString("pt-BR")}
            </div>
          )}
        </div>
        {!done && <ChevronRight size={18} style={{ color: "#D2D2D7", flexShrink: 0, marginTop: 4 }} />}
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-2xl p-12 text-center card-soft"
      style={{ background: "#FFFFFF" }}
    >
      <CheckCircle2 size={36} style={{ color: "#34C759", margin: "0 auto 12px" }} />
      <div style={{ color: "#1D1D1F", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
        Nenhuma avaliação pendente
      </div>
      <p style={{ color: "#AEAEB2", fontSize: 13 }}>
        Você está em dia com todas as suas avaliações de gate.
      </p>
    </div>
  );
}
