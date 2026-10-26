import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Circle, Clock, DoorOpen, RotateCw, UserPlus, Users } from "lucide-react";
import type { Idea } from "../types";
import GateBadge from "../components/GateBadge";
import DeptTag from "../components/DeptTag";
import GateAgingBadge from "../components/GateAgingBadge";
import { ApiError } from "../lib/api";
import { openGateReview } from "../lib/ideas";
import {
  assignEvaluators,
  listEvaluators,
  listGateReviews,
  listTriageIdeas,
  type GateReviewSummary,
} from "../lib/gateReviews";

interface GateTriageProps {
  token: string;
  onOpenIdea: (idea: Idea) => void;
  onSessionExpired: () => void;
}

interface Data {
  triage: Idea[];
  designation: GateReviewSummary[];
  evaluating: GateReviewSummary[];
  evaluators: { id: string; name: string; email: string }[];
}

/** Gestor de Inovação: triagem (abre o G1), designação de avaliadores e acompanhamento da avaliação. */
export default function GateTriage({ token, onOpenIdea, onSessionExpired }: GateTriageProps) {
  const [data, setData] = useState<Data | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sessionExpiredRef = useRef(onSessionExpired);
  sessionExpiredRef.current = onSessionExpired;

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [triage, designation, evaluating, evaluators] = await Promise.all([
        listTriageIdeas(token),
        listGateReviews("AGUARDANDO_DESIGNACAO", token),
        listGateReviews("EM_AVALIACAO", token),
        listEvaluators(token),
      ]);
      setData({ triage, designation, evaluating, evaluators });
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

  async function run(id: string, action: () => Promise<unknown>, success: string) {
    setBusy(id);
    setActionError(null);
    setNotice(null);
    try {
      await action();
      setNotice(success);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        sessionExpiredRef.current();
        return;
      }
      setActionError({ id, message: err instanceof Error ? err.message : "Erro inesperado" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: "#F5F5F7" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 style={{ fontWeight: 700, fontSize: 24, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
            Triagem e designação
          </h1>
          <p style={{ color: "#6E6E73", fontSize: 13, marginTop: 4 }}>
            Abra o Gate 1 das ideias novas, designe os avaliadores de cada gate e acompanhe os pareceres.
          </p>
        </div>

        {notice && (
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={{ background: "rgba(52,199,89,0.1)" }}>
            <CheckCircle2 size={18} style={{ color: "#34C759" }} />
            <span style={{ color: "#1F8A3B", fontSize: 13 }}>{notice}</span>
          </div>
        )}

        {loadError ? (
          <ErrorBox message={loadError} onRetry={load} />
        ) : !data ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ background: "#FFFFFF", height: 100 }} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {/* 1. Triagem */}
            <Section
              title="TRIAGEM — GATE 1"
              count={data.triage.length}
              empty="Nenhuma ideia nova aguardando triagem."
            >
              {data.triage.map((idea) => (
                <div key={idea.id} className="rounded-2xl p-5 card-soft" style={{ background: "#FFFFFF" }}>
                  <div className="flex items-start justify-between gap-4">
                    <IdeaHeading idea={idea} onOpen={() => onOpenIdea(idea)} />
                    <button
                      onClick={() =>
                        run(idea.id, () => openGateReview(idea.id, token), `Gate 1 aberto para “${idea.title}”. Agora designe os avaliadores.`)
                      }
                      disabled={busy !== null}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0"
                      style={primaryButton(busy === idea.id)}
                    >
                      <DoorOpen size={15} />
                      {busy === idea.id ? "Abrindo..." : "Abrir Gate 1"}
                    </button>
                  </div>
                  <InlineError error={actionError} id={idea.id} />
                </div>
              ))}
            </Section>

            {/* 2. Designação */}
            <Section
              title="AGUARDANDO DESIGNAÇÃO"
              count={data.designation.length}
              empty="Nenhum gate aguardando a designação de avaliadores."
            >
              {data.designation.map((review) => (
                <DesignationCard
                  key={review.id}
                  review={review}
                  evaluators={data.evaluators.filter((e) => e.id !== review.idea.authorId)}
                  busy={busy}
                  onOpenIdea={() => onOpenIdea(review.idea)}
                  onAssign={(ids) =>
                    run(
                      review.id,
                      () => assignEvaluators(review.id, ids, token),
                      `${ids.length} avaliador${ids.length > 1 ? "es designados" : " designado"} para “${review.idea.title}”.`,
                    )
                  }
                  error={actionError}
                />
              ))}
            </Section>

            {/* 3. Em avaliação */}
            <Section
              title="EM AVALIAÇÃO"
              count={data.evaluating.length}
              empty="Nenhum gate em avaliação no momento."
            >
              {data.evaluating.map((review) => (
                <div key={review.id} className="rounded-2xl p-5 card-soft" style={{ background: "#FFFFFF" }}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <IdeaHeading idea={review.idea} onOpen={() => onOpenIdea(review.idea)} />
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <GateBadge label={`${review.gate.name} · rodada ${review.round}`} size="sm" />
                      <span
                        className="inline-flex items-center gap-1"
                        style={{ fontSize: 11.5, fontWeight: review.overdue ? 600 : 400, color: review.overdue ? "#9A5B0A" : "#8E8E93" }}
                      >
                        <Clock size={11} />
                        {review.deadlineAt
                          ? `${review.overdue ? "Prazo vencido em" : "Prazo:"} ${new Date(review.deadlineAt).toLocaleDateString("pt-BR")}`
                          : "Sem prazo"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {review.evaluators.map((e) => (
                      <span
                        key={e.id}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
                        style={{
                          background: e.submitted ? "rgba(52,199,89,0.1)" : "#F5F5F7",
                          color: e.submitted ? "#1F8A3B" : "#6E6E73",
                          fontSize: 12,
                        }}
                      >
                        {e.submitted ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                        {e.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function DesignationCard({
  review,
  evaluators,
  busy,
  onOpenIdea,
  onAssign,
  error,
}: {
  review: GateReviewSummary;
  evaluators: { id: string; name: string; email: string }[];
  busy: string | null;
  onOpenIdea: () => void;
  onAssign: (ids: string[]) => void;
  error: { id: string; message: string } | null;
}) {
  // Rodada reaberta após Revisar: vem preenchida com os avaliadores da rodada anterior (P4)
  const [selected, setSelected] = useState<string[]>(() =>
    review.suggestedEvaluatorIds.filter((id) => evaluators.some((e) => e.id === id)),
  );

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="rounded-2xl p-5 card-soft" style={{ background: "#FFFFFF" }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <IdeaHeading idea={review.idea} onOpen={onOpenIdea} />
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <GateBadge label={`${review.gate.name} · rodada ${review.round}`} size="sm" />
          {review.reopenedAfterRevision && (
            <span style={{ color: "#B6790A", fontSize: 11.5, fontWeight: 600 }}>Reenviada após revisão</span>
          )}
          <span style={{ color: "#AEAEB2", fontSize: 11.5 }}>Prazo de {review.gate.deadlineDays} dias após a designação</span>
        </div>
      </div>

      <div style={{ color: "#6E6E73", fontSize: 11.5, fontWeight: 600, marginBottom: 8 }}>
        <Users size={12} style={{ display: "inline", marginRight: 6, verticalAlign: -1 }} />
        Avaliadores (o autor da ideia não aparece)
      </div>
      {evaluators.length === 0 ? (
        <p style={{ color: "#AEAEB2", fontSize: 13 }}>
          Nenhum avaliador aprovado disponível. O Administrador aprova ou atribui o papel de Avaliador em Usuários.
        </p>
      ) : (
        <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {evaluators.map((e) => {
            const checked = selected.includes(e.id);
            return (
              <label
                key={e.id}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                style={{
                  background: checked ? "rgba(245,158,11,0.08)" : "#F5F5F7",
                  border: `1.5px solid ${checked ? "#F59E0B" : "transparent"}`,
                  cursor: "pointer",
                }}
              >
                <input type="checkbox" checked={checked} onChange={() => toggle(e.id)} />
                <span className="min-w-0">
                  <span className="block truncate" style={{ color: "#1D1D1F", fontSize: 13, fontWeight: 600 }}>{e.name}</span>
                  <span className="block truncate" style={{ color: "#AEAEB2", fontSize: 11 }}>{e.email}</span>
                </span>
              </label>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => onAssign(selected)}
          disabled={busy !== null || selected.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={primaryButton(busy === review.id, selected.length === 0)}
        >
          <UserPlus size={15} />
          {busy === review.id
            ? "Designando..."
            : selected.length === 0
              ? "Selecione os avaliadores"
              : `Designar ${selected.length} avaliador${selected.length > 1 ? "es" : ""}`}
        </button>
      </div>
      <InlineError error={error} id={review.id} />
    </div>
  );
}

function IdeaHeading({ idea, onOpen }: { idea: Idea; onOpen: () => void }) {
  return (
    <div className="min-w-0">
      <button
        onClick={onOpen}
        className="text-left"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        title="Ver a ideia completa"
      >
        <span style={{ fontWeight: 700, fontSize: 15, color: "#1D1D1F", lineHeight: 1.3 }}>{idea.title}</span>
      </button>
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <span style={{ color: "#AEAEB2", fontSize: 12 }}>por {idea.author}</span>
        {idea.department && <DeptTag name={idea.department} />}
        <GateAgingBadge idea={idea} />
      </div>
    </div>
  );
}

function Section({ title, count, empty, children }: { title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: "#AEAEB2", fontSize: 11, fontWeight: 600 }}>{title}</span>
        <span className="rounded-full px-2" style={{ background: "#E5E5EA", color: "#6E6E73", fontSize: 11, fontWeight: 600 }}>
          {count}
        </span>
      </div>
      {count === 0 ? (
        <div className="rounded-2xl p-6 text-center" style={{ background: "#FFFFFF", border: "1.5px dashed #E5E5EA" }}>
          <p style={{ color: "#AEAEB2", fontSize: 13 }}>{empty}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">{children}</div>
      )}
    </section>
  );
}

function InlineError({ error, id }: { error: { id: string; message: string } | null; id: string }) {
  if (!error || error.id !== id) return null;
  return (
    <div className="flex items-center gap-1.5 mt-3" style={{ color: "#FF3B30", fontSize: 12.5 }}>
      <AlertCircle size={13} />
      {error.message}
    </div>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-6 rounded-2xl card-soft text-center" style={{ background: "#FFFFFF" }}>
      <div className="flex items-center justify-center gap-2 mb-4" style={{ color: "#FF3B30", fontSize: 13.5 }}>
        <AlertCircle size={15} />
        {message}
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
        style={{ background: "#F5F5F7", color: "#1D1D1F", border: "none", cursor: "pointer", fontSize: 13 }}
      >
        <RotateCw size={13} />
        Tentar novamente
      </button>
    </div>
  );
}

function primaryButton(loading: boolean, disabled = false): React.CSSProperties {
  return {
    background: disabled ? "#F0F0F2" : loading ? "#FBD9AE" : "#F59E0B",
    color: disabled ? "#AEAEB2" : "#FFFFFF",
    border: "none",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    fontSize: 13,
    fontWeight: 600,
  };
}
