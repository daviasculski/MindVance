import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, AlertCircle, User } from "lucide-react";
import { ideas } from "../data";
import GateBadge from "../components/GateBadge";
import GateRail from "../components/GateRail";
import GateAgingBadge from "../components/GateAgingBadge";
import VerdictRing from "../components/VerdictRing";
import { gateForStage } from "../lib/gates";

const PASS_THRESHOLD = 7;

const evaluatorResults = [
  {
    id: "ev1",
    name: "Ana Lira",
    role: "Head de Produto",
    score: 7.1,
    criteria: [
      { name: "Alinhamento Estratégico", score: 7, comment: "Alinhado com metas de eficiência operacional." },
      { name: "Viabilidade Técnica", score: 8, comment: "Tecnologia madura e time capacitado para execução." },
      { name: "Potencial de Mercado", score: 6, comment: "Impacto interno relevante, mas circunscrito." },
      { name: "Risco de Execução", score: 7, comment: "Escopo controlado e risco gerenciável." },
    ],
    justification: "Projeto bem estruturado com benefícios claros e mensuráveis para o time de RH.",
  },
  {
    id: "ev2",
    name: "Rafael Torres",
    role: "Diretor de Tecnologia",
    score: 6.8,
    criteria: [
      { name: "Alinhamento Estratégico", score: 8, comment: "Alta prioridade estratégica para 2026." },
      { name: "Viabilidade Técnica", score: 7, comment: "Tecnicamente viável, mas exige cuidado na integração." },
      { name: "Potencial de Mercado", score: 6, comment: "Produto interno sem potencial de monetização." },
      { name: "Risco de Execução", score: 6, comment: "Dependência de integrações pode aumentar escopo." },
    ],
    justification: "Iniciativa válida. Recomendo aprovação com monitoramento de escopo.",
  },
  {
    id: "ev3",
    name: "Marina Costa",
    role: "Gerente de Inovação",
    score: 7.4,
    criteria: [
      { name: "Alinhamento Estratégico", score: 8, comment: "Totalmente alinhado com pilar de People." },
      { name: "Viabilidade Técnica", score: 7, comment: "Viável com parceiros adequados." },
      { name: "Potencial de Mercado", score: 7, comment: "Benchmarks internacionais mostram 35% de impacto." },
      { name: "Risco de Execução", score: 8, comment: "Time experiente, risco baixo." },
    ],
    justification: "Aprovação recomendada. Produto com potencial de replicação em outras empresas do grupo.",
  },
];

const consolidatedScore = 7.1;
const decidingIdea = ideas.find((i) => i.id === "i6")!;
const decidingGate = gateForStage(decidingIdea.stage)!;

type DecisionType = "aprovada" | "revisão" | "rejeitada" | null;

export default function GateDecision() {
  const [decision, setDecision] = useState<DecisionType>(null);
  const [justification, setJustification] = useState("");
  const [justError, setJustError] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleConfirm() {
    if (!decision) return;
    if (!justification.trim()) { setJustError(true); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setConfirmed(true); }, 1000);
  }

  if (confirmed) {
    const colors = {
      aprovada: { bg: "rgba(52,199,89,0.12)", color: "#1F8A3B", label: "Aprovada" },
      revisão: { bg: "rgba(245,158,11,0.12)", color: "#B6790A", label: "Enviada para Revisão" },
      rejeitada: { bg: "#F0F0F2", color: "#6E6E73", label: "Encerrada nesta etapa" },
    };
    const c = colors[decision as keyof typeof colors];
    return (
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: "#F5F5F7" }}>
        <div className="text-center max-w-md">
          <div
            className="inline-flex items-center justify-center mb-6 rounded-full"
            style={{ width: 64, height: 64, background: c.bg }}
          >
            {decision === "aprovada" ? (
              <CheckCircle2 size={30} style={{ color: c.color }} />
            ) : decision === "rejeitada" ? (
              <XCircle size={30} style={{ color: c.color }} />
            ) : (
              <RotateCcw size={30} style={{ color: c.color }} />
            )}
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 24, color: "#1D1D1F", marginBottom: 12 }}>
            Decisão registrada
          </h2>
          <div style={{ color: c.color, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            Ideia {c.label}
          </div>
          <p style={{ color: "#6E6E73", fontSize: 14, lineHeight: 1.6 }}>
            A decisão e justificativa foram registradas. O autor da ideia será notificado automaticamente.
          </p>
          <button
            onClick={() => { setConfirmed(false); setDecision(null); setJustification(""); }}
            className="mt-6 px-6 py-2.5 rounded-xl font-medium"
            style={{ background: "#F5F5F7", border: "none", color: "#6E6E73", cursor: "pointer", fontSize: 14 }}
          >
            Nova decisão
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: "#F5F5F7" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <GateBadge label={decidingGate.label} />
            <GateAgingBadge idea={decidingIdea} />
          </div>
          <h1 style={{ fontWeight: 700, fontSize: 24, color: "#1D1D1F", letterSpacing: "-0.02em", marginTop: 12, marginBottom: 4 }}>
            {decidingIdea.title}
          </h1>
          <p style={{ color: "#6E6E73", fontSize: 13, marginBottom: 14 }}>
            Todos os avaliadores concluíram. Tome a decisão final.
          </p>
          <div style={{ maxWidth: 480 }}>
            <GateRail stage={decidingIdea.stage} status={decidingIdea.status} size="sm" showLabels />
          </div>
        </div>

        {/* Consolidated score */}
        <div
          className="p-6 mb-6 rounded-2xl card-elevated"
          style={{ background: "#FFFFFF" }}
        >
          <div className="grid gap-6 items-center" style={{ gridTemplateColumns: "auto 1fr" }}>
            <div className="flex flex-col items-center">
              <div style={{ color: "#AEAEB2", fontSize: 10.5, fontWeight: 600, marginBottom: 10 }}>
                VEREDITO CONSOLIDADO
              </div>
              <VerdictRing score={consolidatedScore} threshold={PASS_THRESHOLD} size={140} strokeWidth={13} />
              <div style={{ color: "#6E6E73", fontSize: 12.5, marginTop: 10, textAlign: "center" }}>
                Média ponderada de {evaluatorResults.length} avaliadores
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div style={{ color: "#AEAEB2", fontSize: 10.5, fontWeight: 600, marginBottom: 8 }}>
                RECOMENDAÇÃO DO SISTEMA
              </div>
              <div
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{
                  background: "rgba(52,199,89,0.1)",
                  width: "fit-content",
                }}
              >
                <CheckCircle2 size={18} style={{ color: "#34C759" }} />
                <span style={{ color: "#1F8A3B", fontWeight: 700, fontSize: 15 }}>
                  Aprovar
                </span>
              </div>
              <p style={{ color: "#AEAEB2", fontSize: 12, marginTop: 8 }}>
                Score ≥ {PASS_THRESHOLD.toFixed(1)} → aprovação automática recomendada
              </p>
            </div>
          </div>
        </div>

        {/* Individual evaluations */}
        <div className="mb-6">
          <div style={{ color: "#AEAEB2", fontSize: 11, fontWeight: 600, marginBottom: 10 }}>
            AVALIAÇÕES INDIVIDUAIS
          </div>
          <div className="flex flex-col gap-4">
            {evaluatorResults.map((ev) => (
              <div
                key={ev.id}
                className="p-5 rounded-2xl card-soft"
                style={{ background: "#FFFFFF" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{ width: 34, height: 34, background: "#F5F5F7" }}
                    >
                      <User size={15} style={{ color: "#AEAEB2" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1D1D1F" }}>
                        {ev.name}
                      </div>
                      <div style={{ color: "#AEAEB2", fontSize: 12 }}>{ev.role}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 26, color: "#B6790A", letterSpacing: "-0.01em" }}>
                    {ev.score.toFixed(1)}
                    <span style={{ fontSize: 13, color: "#AEAEB2" }}>/10</span>
                  </div>
                </div>
                <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  {ev.criteria.map((c) => (
                    <div key={c.name} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "#F5F5F7" }}>
                      <span style={{ color: "#6E6E73", fontSize: 11 }}>{c.name}</span>
                      <span style={{ color: "#B6790A", fontSize: 13, fontWeight: 700 }}>{c.score}</span>
                    </div>
                  ))}
                </div>
                <p style={{ color: "#6E6E73", fontSize: 12, lineHeight: 1.6, borderTop: "1px solid #F0F0F2", paddingTop: 10, marginTop: 4 }}>
                  "{ev.justification}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Decision */}
        <div className="p-6 rounded-2xl card-soft" style={{ background: "#FFFFFF" }}>
          <div style={{ color: "#1D1D1F", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            Decisão final
          </div>

          <div className="flex gap-3 mb-6">
            {([
              { type: "aprovada" as const, label: "Aprovar", icon: <CheckCircle2 size={18} />, color: "#1F8A3B", bg: "rgba(52,199,89,0.1)" },
              { type: "revisão" as const, label: "Revisar", icon: <RotateCcw size={18} />, color: "#B6790A", bg: "rgba(245,158,11,0.1)" },
              { type: "rejeitada" as const, label: "Encerrar", icon: <XCircle size={18} />, color: "#6E6E73", bg: "#F0F0F2" },
            ]).map((opt) => (
              <button
                key={opt.type}
                onClick={() => { setDecision(opt.type); setJustError(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition-all"
                style={{
                  background: decision === opt.type ? opt.bg : "#F5F5F7",
                  border: decision === opt.type ? `2px solid ${opt.color}` : "2px solid transparent",
                  color: decision === opt.type ? opt.color : "#6E6E73",
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

          <div className="mb-4">
            <label style={{ color: "#1D1D1F", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
              Justificativa <span style={{ color: "#FF3B30" }}>*</span>
              <span style={{ color: "#AEAEB2", fontWeight: 400, marginLeft: 6 }}>— obrigatória independente da decisão</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => { setJustification(e.target.value); setJustError(false); }}
              placeholder="Registre a justificativa da decisão final..."
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

          <button
            onClick={handleConfirm}
            disabled={!decision || loading}
            className="w-full py-3.5 rounded-xl font-semibold transition-all"
            style={{
              background: !decision ? "#F0F0F2" : loading ? "#FBD9AE" : "#F59E0B",
              color: !decision ? "#AEAEB2" : "#FFFFFF",
              border: "none",
              cursor: !decision ? "not-allowed" : loading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            {loading ? "Registrando..." : !decision ? "Selecione uma decisão" : "Confirmar Decisão Final"}
          </button>
        </div>
      </div>
    </div>
  );
}
