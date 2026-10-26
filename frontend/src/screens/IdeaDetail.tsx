import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileText, Image, Layers, CheckCircle2, XCircle, RotateCcw, Clock, AlertTriangle, Quote, Star, Pencil, Send, Compass, AlertCircle } from "lucide-react";
import type { Idea, TimelineEntry } from "../types";
import { departments } from "../data";
import GateBadge from "../components/GateBadge";
import StatusBadge from "../components/StatusBadge";
import DeptTag from "../components/DeptTag";
import GateRail from "../components/GateRail";
import GateAgingBadge from "../components/GateAgingBadge";
import { rejectionFeedback } from "../lib/ideaVisuals";
import { gateForStage } from "../lib/gates";
import { ApiError } from "../lib/api";
import {
  canRequestGateReview,
  editableStatuses,
  getIdea,
  listGateDecisions,
  listIdeaEvaluations,
  nextStep,
  openGateReview,
  updateIdea,
  type NewIdeaInput,
} from "../lib/ideas";
import { recommendationLabel } from "../lib/gateReviews";

interface IdeaDetailProps {
  idea: Idea;
  /** Id do usuário logado: só o autor pode solicitar revisão do gate */
  viewerId: string;
  onBack: () => void;
  /** Presente quando a ideia vem do backend: busca avaliações e decisões para o histórico. */
  live?: { token: string; onSessionExpired: () => void };
}

export default function IdeaDetail({ idea: initialIdea, viewerId, onBack, live }: IdeaDetailProps) {
  // A ideia muda aqui mesmo quando o autor edita ou solicita a revisão do gate
  const [baseIdea, setBaseIdea] = useState<Idea>(initialIdea);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<TimelineEntry[]>([]);
  useEffect(() => setBaseIdea(initialIdea), [initialIdea]);
  const [evalState, setEvalState] = useState<"idle" | "loading" | "error">(live ? "loading" : "idle");
  const sessionExpiredRef = useRef(live?.onSessionExpired);
  sessionExpiredRef.current = live?.onSessionExpired;
  const token = live?.token;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setEvalState("loading");
    Promise.all([listIdeaEvaluations(baseIdea.id, token), listGateDecisions(baseIdea.id, token)])
      .then(([evaluations, decisions]) => {
        if (cancelled) return;
        setHistory([...evaluations, ...decisions]);
        setEvalState("idle");
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          sessionExpiredRef.current?.();
          return;
        }
        // 403: ideia de outra pessoa (ex.: aberta pelo Mural). O histórico
        // detalhado é privado do autor, então mostra só a submissão.
        setEvalState(err instanceof ApiError && err.status === 403 ? "idle" : "error");
      });
    return () => { cancelled = true; };
  }, [baseIdea.id, token, historyVersion]);

  async function handleError(err: unknown) {
    if (err instanceof ApiError && err.status === 401) {
      sessionExpiredRef.current?.();
      return;
    }
    setActionError(err instanceof Error ? err.message : "Erro inesperado");
  }

  async function requestReview() {
    if (!token) return;
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      const review = await openGateReview(baseIdea.id, token);
      setBaseIdea(await getIdea(baseIdea.id, token));
      setHistoryVersion((v) => v + 1);
      setNotice(
        review.round > 1
          ? `Nova revisão solicitada (Gate ${review.gateOrder}, rodada ${review.round}). O Gestor vai designar os avaliadores.`
          : `Revisão do Gate ${review.gateOrder} solicitada. O Gestor vai designar os avaliadores.`,
      );
    } catch (err) {
      await handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(input: NewIdeaInput) {
    if (!token) return;
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await updateIdea(baseIdea.id, input, token);
      setBaseIdea(await getIdea(baseIdea.id, token));
      setEditing(false);
      setNotice("Alterações salvas. Quando terminar os ajustes, solicite a revisão do gate.");
    } catch (err) {
      await handleError(err);
    } finally {
      setBusy(false);
    }
  }

  // Histórico = submissão + avaliações + decisões de gate, em ordem cronológica
  const idea: Idea = {
    ...baseIdea,
    timeline: [...baseIdea.timeline, ...history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    ),
  };
  const gate = gateForStage(idea.stage);
  const feedback = rejectionFeedback(idea);
  const revisionRequest =
    idea.status === "Em revisão"
      ? [...idea.timeline].reverse().find((t) => t.decision === "revisão")
      : undefined;
  const isAuthor = idea.authorId !== undefined && idea.authorId === viewerId;
  // Ações do autor (Colaborador ou Avaliador que submeteu a ideia), só com dados reais
  const canEdit = Boolean(live) && isAuthor && editableStatuses.includes(idea.status);
  const canRequest = Boolean(live) && isAuthor && canRequestGateReview(idea);

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
        <div className="ml-auto flex items-center gap-2">
          {canEdit && !editing && (
            <button
              onClick={() => { setEditing(true); setNotice(null); setActionError(null); }}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: "#FFFFFF", color: "#1D1D1F", border: "1px solid #E5E5EA", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
            >
              <Pencil size={14} />
              Editar ideia
            </button>
          )}
          {/* D6: G2–G5 e reenvio após Revisar. Notificar o Gestor entra com as notificações. */}
          {canRequest && !editing && (
            <button
              onClick={requestReview}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: busy ? "#FBD9AE" : "#F59E0B", color: "#FFFFFF", border: "none", cursor: busy ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13 }}
            >
              <Send size={14} />
              {busy ? "Solicitando..." : "Solicitar revisão do gate"}
            </button>
          )}
        </div>
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

            <div className="flex items-center gap-3 mb-6">
              <span style={{ color: "#AEAEB2", fontSize: 13 }}>
                por {idea.author}
              </span>
              {idea.department && <DeptTag name={idea.department} />}
              <span style={{ color: "#AEAEB2", fontSize: 13 }}>
                {new Date(idea.submittedAt).toLocaleDateString("pt-BR")}
              </span>
            </div>

            {notice && (
              <div className="flex items-center gap-2 rounded-2xl p-4 mb-6" style={{ background: "rgba(52,199,89,0.1)", color: "#1F8A3B", fontSize: 13 }}>
                <CheckCircle2 size={16} />
                {notice}
              </div>
            )}
            {actionError && (
              <div className="flex items-center gap-2 rounded-2xl p-4 mb-6" style={{ background: "rgba(255,59,48,0.08)", color: "#FF3B30", fontSize: 13 }}>
                <AlertCircle size={15} />
                {actionError}
              </div>
            )}

            {/* Próximo passo esperado (ACO-07), visível ao autor */}
            {isAuthor && live && (
              <div className="flex items-start gap-3 rounded-2xl p-4 mb-8" style={{ background: "#FFFFFF", border: "1px solid #E5E5EA" }}>
                <Compass size={16} style={{ color: "#B6790A", marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div style={{ color: "#AEAEB2", fontSize: 10.5, fontWeight: 600, marginBottom: 3 }}>PRÓXIMO PASSO</div>
                  <p style={{ color: "#1D1D1F", fontSize: 13, lineHeight: 1.55 }}>{nextStep(idea)}</p>
                </div>
              </div>
            )}

            {editing && (
              <EditIdeaForm
                idea={idea}
                busy={busy}
                onCancel={() => setEditing(false)}
                onSave={saveEdit}
              />
            )}

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

            {revisionRequest && (
              <div
                className="p-5 mb-8 rounded-2xl"
                style={{ background: "rgba(245,158,11,0.07)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <RotateCcw size={14} style={{ color: "#B6790A" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#B6790A" }}>
                    DEVOLVIDA PARA REVISÃO — AJUSTES SOLICITADOS
                  </span>
                </div>
                <p style={{ color: "#1D1D1F", fontSize: 13.5, lineHeight: 1.65 }}>
                  {revisionRequest.feedback}
                </p>
                {revisionRequest.reviewPoints && revisionRequest.reviewPoints.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1">
                    {revisionRequest.reviewPoints.map((p, j) => (
                      <li key={j} style={{ color: "#1D1D1F", fontSize: 13, lineHeight: 1.5 }}>
                        · {p}
                      </li>
                    ))}
                  </ul>
                )}
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

            {/* Content sections (no modo de edição, o formulário substitui o conteúdo) */}
            {!editing && (
              <>
                <Section title="Problema Identificado">{idea.problem}</Section>
                <Section title="Solução Proposta">{idea.solution}</Section>
                <Section title="Impacto Estimado">{idea.impact}</Section>
                <Section title="Recursos Necessários">{idea.resources}</Section>
              </>
            )}

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
                                  : entry.decision === "avaliada"
                                  ? "rgba(139,124,246,0.12)"
                                  : "rgba(59,130,246,0.12)",
                            }}
                          >
                            {entry.decision === "avaliada" ? (
                              <Star size={13} style={{ color: "#8B7CF6" }} />
                            ) : entry.decision === "aprovada" ? (
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
                          {entry.stage && (
                            <div style={{ color: "#B6790A", fontSize: 10, fontWeight: 600, letterSpacing: "0.03em" }}>
                              {entry.stage.toUpperCase()}
                              {entry.gateOrder !== undefined && (
                                <span style={{ color: "#AEAEB2" }}>
                                  {" "}· GATE {entry.gateOrder}
                                  {entry.round !== undefined && entry.round > 1 ? ` · RODADA ${entry.round}` : ""}
                                </span>
                              )}
                            </div>
                          )}
                          <div style={{ color: "#1D1D1F", fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>
                            {entry.decision === "avaliada" ? (
                              <>
                                Avaliada ·{" "}
                                <span style={{ color: "#6D5CD6" }}>
                                  nota {(entry.score ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}/10
                                </span>
                              </>
                            ) : entry.decision === "submetida"
                              ? "Submetida"
                              : entry.decision === "aprovada"
                              ? "Aprovada no gate"
                              : entry.decision === "rejeitada"
                              ? "Encerrada"
                              : "Enviada para revisão"}
                          </div>
                          {entry.recommendation && (
                            <div style={{ color: "#AEAEB2", fontSize: 11, marginTop: 1 }}>
                              Recomendação do sistema: {recommendationLabel[entry.recommendation]}
                              {entry.score !== undefined &&
                                ` (score ${entry.score.toLocaleString("pt-BR", { maximumFractionDigits: 2 })})`}
                            </div>
                          )}
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
                {evalState === "loading" && (
                  <div style={{ color: "#AEAEB2", fontSize: 12, marginTop: 4 }}>
                    Carregando avaliações...
                  </div>
                )}
                {evalState === "error" && (
                  <div className="flex items-center gap-1.5" style={{ color: "#FF3B30", fontSize: 12, marginTop: 4 }}>
                    <AlertTriangle size={12} />
                    Não foi possível carregar as avaliações.
                  </div>
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

/** Formulário de edição do autor (ACO-04): mesmos campos da submissão. Não reenvia a ideia. */
function EditIdeaForm({
  idea,
  busy,
  onCancel,
  onSave,
}: {
  idea: Idea;
  busy: boolean;
  onCancel: () => void;
  onSave: (input: NewIdeaInput) => void;
}) {
  const [form, setForm] = useState<NewIdeaInput>({
    title: idea.title,
    problem: idea.problem,
    solution: idea.solution,
    department: idea.department,
    impact: idea.impact,
    resources: idea.resources,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(key: keyof NewIdeaInput, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors(({ [key]: _, ...rest }) => rest);
  }

  function submit() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Título obrigatório";
    else if (form.title.trim().length > 255) e.title = "Título deve ter no máximo 255 caracteres";
    if (!form.problem.trim()) e.problem = "Descreva o problema identificado";
    if (!form.solution.trim()) e.solution = "Descreva a solução proposta";
    if (!form.department) e.department = "Selecione um departamento";
    setErrors(e);
    if (Object.keys(e).length === 0) onSave(form);
  }

  const field = (key: keyof NewIdeaInput, label: string, rows?: number) => (
    <div className="flex flex-col gap-1.5">
      <label style={{ color: "#6E6E73", fontSize: 12.5, fontWeight: 500 }}>{label}</label>
      {rows ? (
        <textarea value={form[key]} onChange={(e) => set(key, e.target.value)} rows={rows} style={inputStyle(!!errors[key])} />
      ) : (
        <input value={form[key]} onChange={(e) => set(key, e.target.value)} style={inputStyle(!!errors[key])} />
      )}
      {errors[key] && (
        <div className="flex items-center gap-1.5" style={{ color: "#FF3B30", fontSize: 12 }}>
          <AlertCircle size={12} />
          {errors[key]}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 mb-8 rounded-2xl card-soft flex flex-col gap-4" style={{ background: "#FFFFFF" }}>
      <div style={{ color: "#AEAEB2", fontSize: 11, fontWeight: 600 }}>EDITAR IDEIA</div>
      {field("title", "Título da ideia *")}
      {field("problem", "Problema identificado *", 4)}
      {field("solution", "Solução proposta *", 4)}
      <div className="flex flex-col gap-1.5">
        <label style={{ color: "#6E6E73", fontSize: 12.5, fontWeight: 500 }}>Área / Departamento de origem *</label>
        <select
          value={form.department}
          onChange={(e) => set("department", e.target.value)}
          style={{ ...inputStyle(!!errors.department), appearance: "none" }}
        >
          <option value="">Selecione seu departamento...</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
        {errors.department && (
          <div className="flex items-center gap-1.5" style={{ color: "#FF3B30", fontSize: 12 }}>
            <AlertCircle size={12} />
            {errors.department}
          </div>
        )}
      </div>
      {field("impact", "Impacto estimado", 3)}
      {field("resources", "Recursos necessários", 3)}
      <p style={{ color: "#AEAEB2", fontSize: 12 }}>
        Salvar não reenvia a ideia ao gate. Quando terminar, use “Solicitar revisão do gate”.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={busy}
          className="px-5 py-2.5 rounded-xl"
          style={{ background: "#F5F5F7", color: "#6E6E73", border: "none", cursor: "pointer", fontSize: 14 }}
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={busy}
          className="px-6 py-2.5 rounded-xl"
          style={{ background: busy ? "#FBD9AE" : "#F59E0B", color: "#FFFFFF", border: "none", cursor: busy ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}
        >
          {busy ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: "#F5F5F7",
    border: `1.5px solid ${hasError ? "#FF3B30" : "transparent"}`,
    borderRadius: 12,
    color: "#1D1D1F",
    fontSize: 13.5,
    padding: "10px 12px",
    outline: "none",
    resize: "vertical",
  };
}