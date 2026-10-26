import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, RotateCcw, RotateCw, User, XCircle } from "lucide-react";
import type { GateDecisionType, Idea } from "../types";
import GateBadge from "../components/GateBadge";
import GateRail from "../components/GateRail";
import DeptTag from "../components/DeptTag";
import VerdictRing from "../components/VerdictRing";
import { ApiError } from "../lib/api";
import {
  decideGate,
  getGateReview,
  listGateReviews,
  recommendationLabel,
  type ApiDecision,
  type GateReviewDetail,
  type GateReviewSummary,
} from "../lib/gateReviews";

interface GateDecisionProps {
  token: string;
  onOpenIdea: (idea: Idea) => void;
  onSessionExpired: () => void;
}

const options: { type: GateDecisionType; api: ApiDecision; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { type: "aprovada", api: "APROVADA", label: "Aprovar", icon: <CheckCircle2 size={18} />, color: "#1F8A3B", bg: "rgba(52,199,89,0.1)" },
  { type: "revisão", api: "REVISAO", label: "Revisar", icon: <RotateCcw size={18} />, color: "#B6790A", bg: "rgba(245,158,11,0.1)" },
  { type: "rejeitada", api: "REJEITADA", label: "Rejeitar", icon: <XCircle size={18} />, color: "#6E6E73", bg: "#F0F0F2" },
];

const recommendationTone: Record<GateDecisionType, { bg: string; color: string; icon: React.ReactNode }> = {
  aprovada: { bg: "rgba(52,199,89,0.1)", color: "#1F8A3B", icon: <CheckCircle2 size={18} style={{ color: "#34C759" }} /> },
  "revisão": { bg: "rgba(245,158,11,0.1)", color: "#B6790A", icon: <RotateCcw size={18} style={{ color: "#F59E0B" }} /> },
  rejeitada: { bg: "#F0F0F2", color: "#6E6E73", icon: <XCircle size={18} style={{ color: "#8E8E93" }} /> },
};

function formatScore(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

/** Gestor de Inovação: decide os gates cujos pareceres já foram todos enviados (D4, D5, D7). */
export default function GateDecision({ token, onOpenIdea, onSessionExpired }: GateDecisionProps) {
  const [queue, setQueue] = useState<GateReviewSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [active, setActive] = useState<GateReviewDetail | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [decision, setDecision] = useState<(typeof options)[number] | null>(null);
  const [justification, setJustification] = useState("");
  const [reviewPoints, setReviewPoints] = useState("");
  const [justError, setJustError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{ title: string; label: string } | null>(null);
  const sessionExpiredRef = useRef(onSessionExpired);
  sessionExpiredRef.current = onSessionExpired;

  const handleError = useCallback((err: unknown, set: (m: string) => void) => {
    if (err instanceof ApiError && err.status === 401) {
      sessionExpiredRef.current();
      return;
    }
    set(err instanceof Error ? err.message : "Erro inesperado");
  }, []);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setQueue(await listGateReviews("AGUARDANDO_DECISAO", token));
    } catch (err) {
      handleError(err, setLoadError);
    }
  }, [token, handleError]);

  useEffect(() => {
    load();
  }, [load]);

  async function open(review: GateReviewSummary) {
    setOpening(review.id);
    setLoadError(null);
    try {
      setActive(await getGateReview(review.id, token));
      setDecision(null);
      setJustification("");
      setReviewPoints("");
      setJustError(false);
      setSubmitError(null);
      setDone(null);
    } catch (err) {
      handleError(err, setLoadError);
    } finally {
      setOpening(null);
    }
  }

  async function confirm() {
    if (!active || !decision) return;
    if (!justification.trim()) {
      setJustError(true);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const points = reviewPoints.split("\n").map((p) => p.trim()).filter(Boolean);
      await decideGate(
        active.id,
        {
          decision: decision.api,
          feedback: justification.trim(),
          ...(decision.api === "REVISAO" && points.length > 0 ? { reviewPoints: points } : {}),
        },
        token,
      );
      setDone({ title: active.idea.title, label: decision.label });
      setActive(null);
      await load();
    } catch (err) {
      handleError(err, setSubmitError);
    } finally {
      setSubmitting(false);
    }
  }

  if (active) {
    const score = active.consolidatedScore ?? 0;
    const recommendation = active.recommendation;
    const againstRecommendation = decision && recommendation && decision.type !== recommendation;
    const isLastGate = active.gate.leadsToFinalStage;
    return (
      <div className="flex-1 overflow-y-auto" style={{ background: "#F5F5F7" }}>
        <div
          className="px-8 py-4 flex items-center gap-4 sticky top-0 z-10"
          style={{ borderBottom: "1px solid #E5E5EA", background: "rgba(245,245,247,0.9)", backdropFilter: "blur(8px)" }}
        >
          <button
            onClick={() => setActive(null)}
            style={{ color: "#6E6E73", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
          >
            ← Voltar às decisões
          </button>
          <div style={{ width: 1, height: 20, background: "#E5E5EA" }} />
          <GateBadge label={`${active.gate.name} · rodada ${active.round}`} size="sm" />
          <button
            onClick={() => onOpenIdea(active.idea)}
            className="ml-auto"
            style={{ color: "#B6790A", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            Ver ideia e histórico completo →
          </button>
        </div>

        <div className="px-8 py-6 max-w-4xl mx-auto">
          <h1 style={{ fontWeight: 700, fontSize: 24, color: "#1D1D1F", letterSpacing: "-0.02em", marginBottom: 6 }}>
            {active.idea.title}
          </h1>
          <div className="flex items-center gap-3 mb-4">
            <span style={{ color: "#AEAEB2", fontSize: 13 }}>por {active.idea.author}</span>
            {active.idea.department && <DeptTag name={active.idea.department} />}
          </div>
          <div style={{ maxWidth: 480 }} className="mb-6">
            <GateRail stage={active.idea.stage} size="sm" showLabels />
          </div>

          {/* Score consolidado e recomendação */}
          <div className="p-6 mb-6 rounded-2xl card-elevated" style={{ background: "#FFFFFF" }}>
            <div className="grid gap-6 items-center" style={{ gridTemplateColumns: "auto 1fr" }}>
              <div className="flex flex-col items-center">
                <div style={{ color: "#AEAEB2", fontSize: 10.5, fontWeight: 600, marginBottom: 10 }}>
                  VEREDITO CONSOLIDADO
                </div>
                <VerdictRing
                  score={score}
                  approveThreshold={active.gate.approveThreshold}
                  reviseThreshold={active.gate.reviseThreshold}
                  size={140}
                  strokeWidth={13}
                />
                <div style={{ color: "#6E6E73", fontSize: 12.5, marginTop: 10, textAlign: "center" }}>
                  Média por critério de {active.evaluations.length} avaliador{active.evaluations.length !== 1 ? "es" : ""}
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <div style={{ color: "#AEAEB2", fontSize: 10.5, fontWeight: 600, marginBottom: 8 }}>
                  RECOMENDAÇÃO DO SISTEMA
                </div>
                {recommendation && (
                  <div
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl"
                    style={{ background: recommendationTone[recommendation].bg, width: "fit-content" }}
                  >
                    {recommendationTone[recommendation].icon}
                    <span style={{ color: recommendationTone[recommendation].color, fontWeight: 700, fontSize: 15 }}>
                      {recommendationLabel[recommendation]}
                    </span>
                  </div>
                )}
                <p style={{ color: "#AEAEB2", fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
                  Score ≥ {formatScore(active.gate.approveThreshold)} recomenda aprovar; de{" "}
                  {formatScore(active.gate.reviseThreshold)} a {formatScore(active.gate.approveThreshold)}, revisar;
                  abaixo, rejeitar. A recomendação é só uma sugestão: a decisão é sua.
                </p>
              </div>
            </div>
          </div>

          {/* Pareceres individuais */}
          <div className="mb-6">
            <div style={{ color: "#AEAEB2", fontSize: 11, fontWeight: 600, marginBottom: 10 }}>PARECERES DOS AVALIADORES</div>
            <div className="flex flex-col gap-4">
              {active.evaluations.map((ev) => (
                <div key={ev.id} className="p-5 rounded-2xl card-soft" style={{ background: "#FFFFFF" }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, background: "#F5F5F7" }}>
                        <User size={15} style={{ color: "#AEAEB2" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1D1D1F" }}>{ev.evaluatorName}</div>
                        <div style={{ color: "#AEAEB2", fontSize: 12 }}>
                          {new Date(ev.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 26, color: "#B6790A", letterSpacing: "-0.01em" }}>
                      {formatScore(ev.score)}
                      <span style={{ fontSize: 13, color: "#AEAEB2" }}>/10</span>
                    </div>
                  </div>
                  <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    {ev.criteria.map((c) => (
                      <div key={c.name} className="px-3 py-2 rounded-xl" style={{ background: "#F5F5F7" }}>
                        <div className="flex items-center justify-between">
                          <span style={{ color: "#6E6E73", fontSize: 11 }}>
                            {c.name} <span style={{ color: "#AEAEB2" }}>· {c.weight}%</span>
                          </span>
                          <span style={{ color: "#B6790A", fontSize: 13, fontWeight: 700 }}>{c.score}</span>
                        </div>
                        {c.comment && (
                          <p style={{ color: "#6E6E73", fontSize: 11.5, marginTop: 4, lineHeight: 1.5 }}>{c.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p style={{ color: "#6E6E73", fontSize: 12.5, lineHeight: 1.6, borderTop: "1px solid #F0F0F2", paddingTop: 10, marginTop: 4 }}>
                    “{ev.justification}”
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Decisão */}
          <div className="p-6 rounded-2xl card-soft" style={{ background: "#FFFFFF" }}>
            <div style={{ color: "#1D1D1F", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Decisão final</div>
            <p style={{ color: "#AEAEB2", fontSize: 12, marginBottom: 16 }}>
              {isLastGate
                ? `Aprovar no ${active.gate.name} leva a ideia ao Lançamento e encerra o ciclo de gates.`
                : "Aprovar avança a ideia ao próximo estágio; Revisar a devolve ao autor no mesmo gate; Rejeitar arquiva a ideia."}
            </p>

            <div className="flex gap-3 mb-5">
              {options.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => {
                    setDecision(opt);
                    setJustError(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl transition-all"
                  style={{
                    background: decision?.type === opt.type ? opt.bg : "#F5F5F7",
                    border: decision?.type === opt.type ? `2px solid ${opt.color}` : "2px solid transparent",
                    color: decision?.type === opt.type ? opt.color : "#6E6E73",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>

            {againstRecommendation && recommendation && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4" style={{ background: "rgba(245,158,11,0.08)", color: "#9A5B0A", fontSize: 12.5 }}>
                <AlertCircle size={13} />
                Você está decidindo diferente da recomendação do sistema ({recommendationLabel[recommendation]}). Isso fica registrado no histórico.
              </div>
            )}

            <div className="mb-4">
              <label style={{ color: "#1D1D1F", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                Justificativa <span style={{ color: "#FF3B30" }}>*</span>
                <span style={{ color: "#AEAEB2", fontWeight: 400, marginLeft: 6 }}>— obrigatória em qualquer decisão; o autor recebe este feedback</span>
              </label>
              <textarea
                value={justification}
                onChange={(e) => {
                  setJustification(e.target.value);
                  setJustError(false);
                }}
                placeholder="Registre a justificativa da decisão..."
                rows={4}
                style={{
                  width: "100%",
                  background: "#F5F5F7",
                  border: `1.5px solid ${justError ? "#FF3B30" : "transparent"}`,
                  borderRadius: 14,
                  color: "#1D1D1F",
                  fontSize: 13.5,
                  padding: "12px 14px",
                  outline: "none",
                  resize: "vertical",
                }}
              />
              {justError && (
                <div className="flex items-center gap-1.5 mt-2" style={{ color: "#FF3B30", fontSize: 12 }}>
                  <AlertCircle size={12} />
                  Justificativa obrigatória antes de confirmar a decisão
                </div>
              )}
            </div>

            {decision?.api === "REVISAO" && (
              <div className="mb-4">
                <label style={{ color: "#1D1D1F", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Pontos a revisar <span style={{ color: "#AEAEB2", fontWeight: 400 }}>— opcional, um por linha</span>
                </label>
                <textarea
                  value={reviewPoints}
                  onChange={(e) => setReviewPoints(e.target.value)}
                  placeholder={"Detalhar o orçamento\nIncluir plano de rollout"}
                  rows={3}
                  style={{
                    width: "100%",
                    background: "#F5F5F7",
                    border: "1.5px solid transparent",
                    borderRadius: 14,
                    color: "#1D1D1F",
                    fontSize: 13.5,
                    padding: "12px 14px",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>
            )}

            {submitError && (
              <div className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 mb-4" style={{ color: "#FF3B30", fontSize: 12.5, background: "rgba(255,59,48,0.08)" }}>
                <AlertCircle size={13} />
                {submitError}
              </div>
            )}

            <button
              onClick={confirm}
              disabled={!decision || submitting}
              className="w-full py-3.5 rounded-xl transition-all"
              style={{
                background: !decision ? "#F0F0F2" : submitting ? "#FBD9AE" : "#F59E0B",
                color: !decision ? "#AEAEB2" : "#FFFFFF",
                border: "none",
                cursor: !decision || submitting ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              {submitting ? "Registrando..." : !decision ? "Selecione uma decisão" : `Confirmar: ${decision.label}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: "#F5F5F7" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 style={{ fontWeight: 700, fontSize: 24, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Decisão de Gate</h1>
          <p style={{ color: "#6E6E73", fontSize: 13, marginTop: 4 }}>
            {queue
              ? `${queue.length} gate${queue.length !== 1 ? "s" : ""} com todos os pareceres, aguardando a sua decisão`
              : "Gates com todos os pareceres enviados"}
          </p>
        </div>

        {done && (
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={{ background: "rgba(52,199,89,0.1)" }}>
            <CheckCircle2 size={18} style={{ color: "#34C759" }} />
            <span style={{ color: "#1F8A3B", fontSize: 13 }}>
              Decisão registrada: “{done.title}” — {done.label}. O histórico da ideia foi atualizado.
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
            {[0, 1].map((i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ background: "#FFFFFF", height: 100 }} />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <div className="rounded-2xl p-12 text-center card-soft" style={{ background: "#FFFFFF" }}>
            <CheckCircle2 size={36} style={{ color: "#34C759", margin: "0 auto 12px" }} />
            <div style={{ color: "#1D1D1F", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Nenhuma decisão pendente</div>
            <p style={{ color: "#AEAEB2", fontSize: 13 }}>
              Os gates aparecem aqui quando todos os avaliadores designados enviam o parecer.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {queue.map((r) => (
              <button
                key={r.id}
                onClick={() => open(r)}
                disabled={opening !== null}
                className="w-full text-left rounded-2xl p-5 card-soft"
                style={{ background: "#FFFFFF", border: "none", cursor: "pointer" }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <GateBadge label={`${r.gate.name} · rodada ${r.round}`} size="sm" />
                      {r.recommendation && (
                        <span style={{ color: recommendationTone[r.recommendation].color, fontSize: 11.5, fontWeight: 600 }}>
                          Recomenda: {recommendationLabel[r.recommendation]}
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: "#1D1D1F", marginBottom: 4 }}>{r.idea.title}</div>
                    <div style={{ color: "#AEAEB2", fontSize: 12 }}>
                      por {r.idea.author} · {r.evaluators.length} parecer{r.evaluators.length !== 1 ? "es" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {r.consolidatedScore !== null && (
                      <span style={{ fontWeight: 700, fontSize: 22, color: "#1D1D1F" }}>
                        {formatScore(r.consolidatedScore)}
                        <span style={{ fontSize: 12, color: "#AEAEB2" }}>/10</span>
                      </span>
                    )}
                    <ChevronRight size={18} style={{ color: "#D2D2D7" }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
