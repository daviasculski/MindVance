import { useCallback, useEffect, useRef, useState } from "react";
import { Lightbulb, PlusCircle, Calendar, AlertCircle, RotateCw } from "lucide-react";
import type { AuthUser, Idea } from "../types";
import DeptTag from "../components/DeptTag";
import GateBadge from "../components/GateBadge";
import GateRail from "../components/GateRail";
import { ApiError } from "../lib/api";
import { listIdeasByAuthor, toIdea } from "../lib/ideas";
import { gateForStage } from "../lib/gates";

interface MyIdeasProps {
  user: AuthUser;
  token: string;
  onOpenIdea: (idea: Idea) => void;
  onNewIdea: () => void;
  onSessionExpired: () => void;
}

export default function MyIdeas({ user, token, onOpenIdea, onNewIdea, onSessionExpired }: MyIdeasProps) {
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Ref para não recarregar a lista quando o App recria o callback
  const sessionExpiredRef = useRef(onSessionExpired);
  sessionExpiredRef.current = onSessionExpired;

  const load = useCallback(async () => {
    setError(null);
    setIdeas(null);
    try {
      const data = await listIdeasByAuthor(user.id, token);
      setIdeas(data.map((i) => toIdea(i, user.name)));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        sessionExpiredRef.current();
        return;
      }
      setError(err instanceof Error ? err.message : "Erro inesperado");
    }
  }, [user.id, user.name, token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: "#F5F5F7" }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Lightbulb size={22} style={{ color: "#F59E0B" }} />
              <h1 style={{ fontWeight: 700, fontSize: 24, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                Minhas Ideias
              </h1>
            </div>
            <p style={{ color: "#6E6E73", fontSize: 13 }}>
              {ideas
                ? `${ideas.length} ideia${ideas.length !== 1 ? "s" : ""} submetida${ideas.length !== 1 ? "s" : ""} por você`
                : "Acompanhe o andamento das ideias que você submeteu"}
            </p>
          </div>
          {ideas && ideas.length > 0 && (
            <button
              onClick={onNewIdea}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0"
              style={{ background: "#F59E0B", color: "#FFFFFF", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >
              <PlusCircle size={15} />
              Nova ideia
            </button>
          )}
        </div>

        {error ? (
          <div className="p-6 rounded-2xl card-soft text-center" style={{ background: "#FFFFFF" }}>
            <div className="flex items-center justify-center gap-2 mb-4" style={{ color: "#FF3B30", fontSize: 13.5 }}>
              <AlertCircle size={15} />
              {error}
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
        ) : ideas === null ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ background: "#FFFFFF", height: 132 }} />
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <div className="p-10 rounded-2xl card-soft text-center" style={{ background: "#FFFFFF" }}>
            <div
              className="inline-flex items-center justify-center mb-4 rounded-full"
              style={{ width: 52, height: 52, background: "rgba(245,158,11,0.1)" }}
            >
              <Lightbulb size={24} style={{ color: "#F59E0B" }} />
            </div>
            <div style={{ color: "#1D1D1F", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              Você ainda não submeteu nenhuma ideia
            </div>
            <p style={{ color: "#6E6E73", fontSize: 13, marginBottom: 20 }}>
              Toda grande inovação começa com uma ideia. Que tal compartilhar a sua?
            </p>
            <button
              onClick={onNewIdea}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl"
              style={{ background: "#F59E0B", color: "#FFFFFF", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
            >
              <PlusCircle size={15} />
              Submeter minha primeira ideia
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ideas.map((idea) => (
              <IdeaRow key={idea.id} idea={idea} onClick={() => onOpenIdea(idea)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IdeaRow({ idea, onClick }: { idea: Idea; onClick: () => void }) {
  const gate = gateForStage(idea.stage);
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-5 rounded-2xl card-soft transition-transform hover:-translate-y-0.5"
      style={{ background: "#FFFFFF", border: "none", cursor: "pointer" }}
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1D1D1F", lineHeight: 1.3 }}>
          {idea.title}
        </h3>
        <GateBadge label={gate ? `Gate ${gate.n} — ${idea.stage}` : idea.stage} size="sm" />
      </div>

      <p
        style={{
          color: "#6E6E73",
          fontSize: 12.5,
          lineHeight: 1.6,
          marginBottom: 14,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {idea.solution}
      </p>

      <div className="mb-3">
        <GateRail stage={idea.stage} status={idea.status} size="xs" />
      </div>

      <div className="flex items-center gap-3">
        {idea.department && <DeptTag name={idea.department} />}
        <span className="flex items-center gap-1.5" style={{ color: "#AEAEB2", fontSize: 11.5 }}>
          <Calendar size={11} />
          {new Date(idea.submittedAt).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </button>
  );
}
