import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, CheckCircle2, ChevronRight, AlertCircle, RotateCw, Calendar } from "lucide-react";
import GateBadge from "../components/GateBadge";
import GateRail from "../components/GateRail";
import DeptTag from "../components/DeptTag";
import VerdictRing from "../components/VerdictRing";
import WeightedSlider from "../components/WeightedSlider";
import { ApiError } from "../lib/api";
import { gateForStage } from "../lib/gates";
import {
  MAX_SCORE,
  getEvaluationQueue,
  submitEvaluation,
  type CompletedEvaluation,
  type CriterionInput,
  type PendingEvaluation,
} from "../lib/evaluations";
import { recommend, recommendationLabel, weightedScore } from "../lib/gateReviews";
import type { Stage } from "../types";

interface GateEvaluationProps {
  token: string;
  onSessionExpired: () => void;
}

type EvaluationFilter = "pending" | "completed" | "all";

/** Critérios do gate da rodada, sem nota: o avaliador precisa pontuar cada um (UC02 FA01). */
function newCriteria(item: PendingEvaluation | null): CriterionInput[] {
  return (item?.gate.criteria ?? []).map((c) => ({ ...c, score: null, comment: "" }));
}

function formatDeadline(item: PendingEvaluation) {
  if (!item.deadlineAt) return "Sem prazo";
  const date = new Date(item.deadlineAt).toLocaleDateString("pt-BR");
  return item.overdue ? `Prazo vencido em ${date}` : `Prazo: ${date}`;
}

function gateLabel(stage: Stage) {
  return gateForStage(stage)?.label ?? stage;
}

export default function GateEvaluation({ token, onSessionExpired }: GateEvaluationProps) {
  const [queue, setQueue] = useState<{ pending: PendingEvaluation[]; completed: CompletedEvaluation[] } | null>(null);
  const [filter, setFilter] = useState<EvaluationFilter>("pending");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [active, setActive] = useState<PendingEvaluation | null>(null);
  const [criteria, setCriteria] = useState<CriterionInput[]>([]);
  const [justification, setJustification] = useState("");
  const [justError, setJustError] = useState(false);
  const [scoreError, setScoreError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedTitle, setSubmittedTitle] = useState<string | null>(null);
  const sessionExpiredRef = useRef(onSessionExpired);
  sessionExpiredRef.current = onSessionExpired;

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setQueue(await getEvaluationQueue(token));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        sessionExpiredRef.current();
        return;
      }
      setLoadError(err instanceof Error ? err.message : "Erro inesperado");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function openEvaluation(item: PendingEvaluation) {
    setActive(item);
    setCriteria(newCriteria(item));
    setScoreError(false);
    setJustification("");
    setJustError(false);
    setSubmitError(null);
    setSubmittedTitle(null);
  }

  function updateCriterion(index: number, patch: Partial<CriterionInput>) {
    setCriteria((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
    if (patch.score !== undefined) setScoreError(false);
  }

  async function handleSubmit() {
    if (!active) return;
    const missingScore = criteria.some((c) => c.score === null);
    setScoreError(missingScore);
    setJustError(!justification.trim());
    if (missingScore || !justification.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitEvaluation({ reviewId: active.reviewId, justification, criteria }, token);
      const completedEvaluation: CompletedEvaluation = {
        id: active.reviewId,
        ideaId: active.ideaId,
        ideaTitle: active.title,
        stage: active.stage,
        round: active.round,
        score: weightedScore(criteria.map((criterion) => ({
          weight: criterion.weight,
          score: criterion.score ?? 0,
        }))),
        createdAt: new Date().toISOString(),
      };
      setQueue((current) =>
        current
          ? {
              pending: current.pending.filter((item) => item.reviewId !== active.reviewId),
              completed: [completedEvaluation, ...current.completed],
            }
          : current,
      );
      setSubmittedTitle(active.title);
      setActive(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        sessionExpiredRef.current();
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        setSubmitError("Você já enviou o parecer desta rodada.");
        load();
      } else {
        setSubmitError(err instanceof Error ? err.message : "Erro inesperado");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (active) {
    const total = weightedScore(criteria.map((c) => ({ weight: c.weight, score: c.score ?? 0 })));
    const verdict = recommend(total, active.gate);
    return (
      <div className="flex-1 overflow-y-auto" style={{ background: "#F5F5F7" }}>
        <div
          className="px-8 py-4 flex items-center gap-4 sticky top-0 z-10"
          style={{ borderBottom: "1px solid #E5E5EA", background: "rgba(245,245,247,0.9)", backdropFilter: "blur(8px)" }}
        >
          <button
            onClick={() => setActive(null)}
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
          <GateBadge label={gateLabel(active.stage)} size="sm" />
          {active.round > 1 && (
            <span style={{ color: "#B6790A", fontSize: 12, fontWeight: 600 }}>Rodada {active.round} · reenviada após revisão</span>
          )}
          <div style={{ color: active.overdue ? "#B6790A" : "#8E8E93", fontSize: 12, fontWeight: active.overdue ? 600 : 400, marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={12} />
            {formatDeadline(active)}
          </div>
        </div>

        <div className="px-8 py-6 max-w-4xl mx-auto">
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#1D1D1F", letterSpacing: "-0.02em", marginBottom: 6 }}>
            {active.title}
          </h2>
          <div className="flex items-center gap-3 mb-4">
            <span style={{ color: "#AEAEB2", fontSize: 13 }}>por {active.authorName}</span>
            {active.extra.department && <DeptTag name={active.extra.department} />}
            <span style={{ color: "#AEAEB2", fontSize: 13 }}>
              {new Date(active.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <div className="mb-6">
            <GateRail stage={active.stage} size="sm" showLabels />
          </div>

          {/* Resumo da ideia: o avaliador precisa ler o que está avaliando */}
          <div className="rounded-2xl p-5 mb-8 card-soft" style={{ background: "#FFFFFF" }}>
            <div style={{ color: "#AEAEB2", fontSize: 11, fontWeight: 600, marginBottom: 14 }}>
              RESUMO DA IDEIA
            </div>
            <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <SummaryField title="Problema identificado" text={active.extra.problem} />
              <SummaryField title="Solução proposta" text={active.solution} />
              <SummaryField title="Impacto estimado" text={active.extra.impact} />
              <SummaryField title="Recursos necessários" text={active.extra.resources} />
            </div>
          </div>

          <p style={{ color: "#6E6E73", fontSize: 13, marginBottom: 16 }}>
            Dê uma nota de 0 a 10 a cada critério. O anel mostra a sua nota ponderada e a recomendação que ela gera.
          </p>
          {scoreError && (
            <div className="flex items-center gap-1.5 mb-4" style={{ color: "#FF3B30", fontSize: 12.5 }}>
              <AlertCircle size={13} />
              Dê nota a todos os critérios antes de confirmar o envio
            </div>
          )}

          <div className="grid gap-8 mb-8" style={{ gridTemplateColumns: "1fr 220px" }}>
            {/* Criteria */}
            <div className="flex flex-col gap-5">
              {criteria.map((c, i) => (
                <CriteriaRow
                  key={c.id}
                  criteria={c}
                  onScoreChange={(score) => updateCriterion(i, { score })}
                  onCommentChange={(comment) => updateCriterion(i, { comment })}
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
                <VerdictRing
                  score={total}
                  approveThreshold={active.gate.approveThreshold}
                  reviseThreshold={active.gate.reviseThreshold}
                  size={148}
                  strokeWidth={14}
                />
                <RecommendationPill verdict={verdict} />
              </div>
            </div>
          </div>

          {/* Justification */}
          <div className="mb-6">
            <label style={{ color: "#1D1D1F", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
              Justificativa geral <span style={{ color: "#FF3B30" }}>*</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => { setJustification(e.target.value); setJustError(false); }}
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

          {submitError && (
            <div
              className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 mb-4"
              style={{ color: "#FF3B30", fontSize: 12.5, background: "rgba(255,59,48,0.08)" }}
            >
              <AlertCircle size={13} />
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-semibold"
            style={{
              background: submitting ? "#FBD9AE" : "#F59E0B",
              color: "#FFFFFF",
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            {submitting
              ? "Enviando..."
              : `Confirmar Avaliação · nota ${total.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}/${MAX_SCORE}`}
          </button>
        </div>
      </div>
    );
  }

  const pending = queue?.pending ?? [];
  const done = queue?.completed ?? [];
  const visiblePending = filter !== "completed" ? pending : [];
  const visibleDone = filter !== "pending" ? done : [];
  const visibleCount = visiblePending.length + visibleDone.length;

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: "#F5F5F7" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 style={{ fontWeight: 700, fontSize: 24, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
            Fila de Avaliações
          </h1>
          <p style={{ color: "#6E6E73", fontSize: 13, marginTop: 4 }}>
            {queue
              ? `${pending.length} pendente${pending.length !== 1 ? "s" : ""} · ${done.length} avaliada${done.length !== 1 ? "s" : ""}`
              : "Ideias aguardando a sua avaliação"}
          </p>
        </div>

        {submittedTitle && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-center gap-3"
            style={{ background: "rgba(52,199,89,0.1)" }}
          >
            <CheckCircle2 size={18} style={{ color: "#34C759" }} />
            <span style={{ color: "#1F8A3B", fontSize: 13 }}>
              Avaliação de “{submittedTitle}” enviada com sucesso.
            </span>
          </div>
        )}

        {loadError ? (
          <div className="p-6 rounded-2xl card-soft text-center" style={{ background: "#FFFFFF" }}>
            <div className="flex items-center justify-center gap-2 mb-4" style={{ color: "#FF3B30", fontSize: 13.5 }}>
              <AlertCircle size={15} />
              {loadError}
            </div>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: "#F5F5F7", color: "#1D1D1F", border: "none", cursor: "pointer", fontSize: 13 }}
            >
              <RotateCw size={13} />
              Tentar novamente
            </button>
          </div>
        ) : !queue ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ background: "#FFFFFF", height: 116 }} />
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-5" role="group" aria-label="Filtrar avaliações">
              {([
                ["pending", "Pendentes", pending.length],
                ["completed", "Avaliadas", done.length],
                ["all", "Todas", pending.length + done.length],
              ] as const).map(([value, label, count]) => {
                const selected = filter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setFilter(value)}
                    className="px-3.5 py-2 rounded-xl transition-colors"
                    style={{
                      background: selected ? "#1D1D1F" : "#FFFFFF",
                      color: selected ? "#FFFFFF" : "#6E6E73",
                      border: `1px solid ${selected ? "#1D1D1F" : "#E5E5EA"}`,
                      cursor: "pointer",
                      fontSize: 12.5,
                      fontWeight: selected ? 600 : 500,
                    }}
                  >
                    {label} <span style={{ opacity: selected ? 0.75 : 0.65 }}>({count})</span>
                  </button>
                );
              })}
            </div>

            {visibleCount === 0 ? (
              <EvaluationEmptyState filter={filter} />
            ) : (
              <>
                {/* Pending */}
                {visiblePending.length > 0 && (
                  <div className="mb-8">
                    <div style={{ color: "#AEAEB2", fontSize: 11, fontWeight: 600, marginBottom: 10 }}>
                      PENDENTES
                    </div>
                    <div className="flex flex-col gap-3">
                      {visiblePending.map((p) => (
                        <PendingCard key={p.reviewId} item={p} onClick={() => openEvaluation(p)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Done */}
                {visibleDone.length > 0 && (
                  <div className={visiblePending.length === 0 ? "mt-8" : ""}>
                    <div style={{ color: "#AEAEB2", fontSize: 11, fontWeight: 600, marginBottom: 10 }}>
                      CONCLUÍDAS
                    </div>
                    <div className="flex flex-col gap-3">
                      {visibleDone.map((d) => (
                        <DoneCard key={d.id} item={d} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryField({ title, text }: { title: string; text?: string }) {
  return (
    <div>
      <div style={{ color: "#6E6E73", fontSize: 11.5, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      {text ? (
        <p style={{ color: "#1D1D1F", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{text}</p>
      ) : (
        <p style={{ color: "#AEAEB2", fontSize: 13, fontStyle: "italic" }}>Não informado</p>
      )}
    </div>
  );
}

function CriteriaRow({
  criteria,
  onScoreChange,
  onCommentChange,
}: {
  criteria: CriterionInput;
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
        max={MAX_SCORE}
        description={criteria.description}
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

/** Recomendação que a nota atual gera (mesma regra do backend). */
function RecommendationPill({ verdict }: { verdict: ReturnType<typeof recommend> }) {
  const tone = {
    aprovada: { bg: "rgba(52,199,89,0.12)", color: "#1F8A3B" },
    "revisão": { bg: "rgba(245,158,11,0.12)", color: "#B6790A" },
    rejeitada: { bg: "#F0F0F2", color: "#6E6E73" },
  }[verdict];
  return (
    <div
      className="mt-3 rounded-full"
      style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 12px", background: tone.bg, color: tone.color }}
    >
      Recomenda: {recommendationLabel[verdict]}
    </div>
  );
}

function PendingCard({ item, onClick }: { item: PendingEvaluation; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-5 transition-all card-soft"
      style={{ background: "#FFFFFF", cursor: "pointer", border: "none" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <GateBadge label={gateLabel(item.stage)} size="sm" />
            {item.round > 1 && (
              <span style={{ color: "#B6790A", fontSize: 11, fontWeight: 600 }}>Rodada {item.round}</span>
            )}
            <span
              className="inline-flex items-center gap-1 rounded-full"
              style={{
                background: item.overdue ? "#FDE7C8" : "#F0F0F2",
                color: item.overdue ? "#9A5B0A" : "#6E6E73",
                fontSize: 10.5,
                fontWeight: 600,
                padding: "2px 8px",
              }}
            >
              <Clock size={10} />
              {formatDeadline(item)}
            </span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#1D1D1F", marginBottom: 4 }}>
            {item.title}
          </div>
          <div style={{ color: "#AEAEB2", fontSize: 12, marginBottom: 10 }}>
            por {item.authorName}{item.extra.department ? ` · ${item.extra.department}` : ""}
          </div>
          <div style={{ maxWidth: 320 }}>
            <GateRail stage={item.stage} size="xs" />
          </div>
        </div>
        <ChevronRight size={18} style={{ color: "#D2D2D7", flexShrink: 0, marginTop: 4 }} />
      </div>
    </button>
  );
}

function DoneCard({ item }: { item: CompletedEvaluation }) {
  return (
    <div className="w-full rounded-2xl p-5 card-soft" style={{ background: "#FFFFFF", opacity: 0.8 }}>
      <div className="flex items-center gap-2 mb-1.5">
        <GateBadge label={gateLabel(item.stage)} size="sm" tone="neutral" />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#1F8A3B", fontSize: 11 }}>
          <CheckCircle2 size={12} />
          Concluída
        </span>
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, color: "#1D1D1F", marginBottom: 6 }}>
        {item.ideaTitle}
      </div>
      <div className="flex items-center gap-3" style={{ color: "#AEAEB2", fontSize: 12 }}>
        <span>
          Nota enviada:{" "}
          <span style={{ color: "#B6790A", fontWeight: 600 }}>
            {item.score.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}/{MAX_SCORE}
          </span>
        </span>
        {item.round !== null && item.round > 1 && <span>Rodada {item.round}</span>}
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {new Date(item.createdAt).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </div>
  );
}

function EvaluationEmptyState({ filter }: { filter: EvaluationFilter }) {
  const messages: Record<EvaluationFilter, { title: string; description: string }> = {
    pending: {
      title: "Nenhuma avaliação pendente",
      description: "Você não possui avaliações pendentes no momento.",
    },
    completed: {
      title: "Nenhuma avaliação enviada",
      description: "As avaliações que você concluir aparecerão aqui.",
    },
    all: {
      title: "Nenhuma avaliação atribuída",
      description: "Não há avaliações pendentes nem concluídas para exibir.",
    },
  };
  const message = messages[filter];

  return (
    <div
      className="rounded-2xl p-12 text-center card-soft"
      style={{ background: "#FFFFFF" }}
    >
      <CheckCircle2 size={36} style={{ color: filter === "pending" ? "#34C759" : "#AEAEB2", margin: "0 auto 12px" }} />
      <div style={{ color: "#1D1D1F", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
        {message.title}
      </div>
      <p style={{ color: "#AEAEB2", fontSize: 13 }}>
        {message.description}
      </p>
    </div>
  );
}
