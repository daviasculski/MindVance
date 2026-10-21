import { useCallback, useEffect, useRef, useState } from "react";
import { Trophy, Calendar, Rocket, AlertCircle, RotateCw } from "lucide-react";
import type { Idea } from "../types";
import DeptTag from "../components/DeptTag";
import GateRail from "../components/GateRail";
import { presenceForIdea } from "../lib/ideaVisuals";
import { ApiError } from "../lib/api";
import { listLaunchIdeas, toIdea } from "../lib/ideas";

interface ApprovedBoardProps {
  token: string;
  onOpenIdea: (idea: Idea) => void;
  onSessionExpired: () => void;
}

export default function ApprovedBoard({ token, onOpenIdea, onSessionExpired }: ApprovedBoardProps) {
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionExpiredRef = useRef(onSessionExpired);
  sessionExpiredRef.current = onSessionExpired;

  const load = useCallback(async () => {
    setError(null);
    setIdeas(null);
    try {
      const data = await listLaunchIdeas(token);
      setIdeas(data.map((i) => toIdea(i)));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        sessionExpiredRef.current();
        return;
      }
      setError(err instanceof Error ? err.message : "Erro inesperado");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // Aprovadas no último gate (verde) e as que chegaram ao Lançamento e aguardam a decisão final (azul)
  const approvedIdeas = (ideas ?? []).filter((i) => i.status === "Aprovada");
  const launchedOthers = (ideas ?? []).filter((i) => i.status === "Em andamento");

  if (error || !ideas) {
    return (
      <div className="flex-1 overflow-y-auto p-8" style={{ background: "#F5F5F7" }}>
        <div className="max-w-5xl mx-auto">
          <BoardHeader count={null} />
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
          ) : (
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl animate-pulse" style={{ background: "#FFFFFF", height: 240 }} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: "#F5F5F7" }}>
      <div className="max-w-5xl mx-auto">
        <BoardHeader count={approvedIdeas.length} />

        {approvedIdeas.length === 0 && launchedOthers.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {approvedIdeas.map((idea) => (
              <IdeaShowcaseCard key={idea.id} idea={idea} accent="#34C759" onClick={() => onOpenIdea(idea)} />
            ))}
            {launchedOthers.map((idea) => (
              <IdeaShowcaseCard key={idea.id} idea={idea} accent="#3B82F6" onClick={() => onOpenIdea(idea)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BoardHeader({ count }: { count: number | null }) {
  return (
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
        {count === null
          ? "Iniciativas aprovadas no funil de inovação"
          : `Iniciativas aprovadas no funil de inovação — ${count} ideia${count !== 1 ? "s" : ""}`}
      </p>
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
