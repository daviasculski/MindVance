import { useCallback, useEffect, useState } from "react";
import { Check, RefreshCw, UserCheck, X } from "lucide-react";
import { ApiError } from "../lib/api";
import {
  decideUserApproval,
  listPendingApprovals,
  type PendingApproval,
} from "../lib/auth";

interface ApprovalRequestsProps {
  token: string;
  onSessionExpired: () => void;
}

export default function ApprovalRequests({
  token,
  onSessionExpired,
}: ApprovalRequestsProps) {
  const [requests, setRequests] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeRequest, setActiveRequest] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRequests(await listPendingApprovals(token));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onSessionExpired();
        return;
      }
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar as solicitações.",
      );
    } finally {
      setLoading(false);
    }
  }, [onSessionExpired, token]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  async function handleDecision(
    request: PendingApproval,
    status: "APPROVED" | "REJECTED",
  ) {
    setActiveRequest(request.id);
    setActionError("");
    try {
      await decideUserApproval(request.id, status, token);
      setRequests((current) =>
        current.filter((item) => item.id !== request.id),
      );
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onSessionExpired();
        return;
      }
      setActionError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível atualizar a solicitação.",
      );
    } finally {
      setActiveRequest(null);
    }
  }

  return (
    <section
      className="flex-1 overflow-y-auto p-8"
      style={{ background: "#F5F5F7" }}
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1
              style={{
                color: "#1D1D1F",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              Solicitações de acesso
            </h1>
            <p style={{ color: "#6E6E73", fontSize: 13, marginTop: 5 }}>
              Aprove ou rejeite os pedidos de acesso de avaliadores e gestores
              de inovação.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadRequests()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E5EA",
              color: "#6E6E73",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13,
            }}
          >
            <RefreshCw size={15} />
            Atualizar
          </button>
        </div>

        {actionError && (
          <div
            className="mb-4 rounded-xl px-4 py-3"
            role="alert"
            style={{
              background: "rgba(255,59,48,0.08)",
              color: "#C62828",
              fontSize: 13,
            }}
          >
            {actionError}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl card-elevated" style={{ background: "#FFFFFF" }}>
          {loading ? (
            <p className="p-6" style={{ color: "#6E6E73", fontSize: 14 }}>
              Carregando solicitações...
            </p>
          ) : error ? (
            <div className="p-6">
              <p className="mb-4" role="alert" style={{ color: "#C62828", fontSize: 14 }}>
                {error}
              </p>
              <button
                type="button"
                onClick={() => void loadRequests()}
                style={{ color: "#8A5A00", fontSize: 13 }}
              >
                Tentar novamente
              </button>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-10 text-center">
              <UserCheck size={28} style={{ color: "#34A853", margin: "0 auto 12px" }} />
              <p style={{ color: "#1D1D1F", fontSize: 15, fontWeight: 600 }}>
                Nenhuma solicitação pendente
              </p>
              <p style={{ color: "#8E8E93", fontSize: 13, marginTop: 5 }}>
                Os novos pedidos de acesso aparecerão aqui.
              </p>
            </div>
          ) : (
            <ul>
              {requests.map((request, index) => (
                <li
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-5"
                  style={{
                    borderBottom:
                      index < requests.length - 1 ? "1px solid #F0F0F2" : "none",
                  }}
                >
                  <div className="min-w-0">
                    <p
                      className="truncate"
                      style={{ color: "#1D1D1F", fontSize: 14, fontWeight: 600 }}
                    >
                      {request.name}
                    </p>
                    <p
                      className="truncate"
                      style={{ color: "#6E6E73", fontSize: 12.5, marginTop: 3 }}
                    >
                      {request.email}
                    </p>
                    <span
                      className="mt-2 inline-flex rounded-full px-2.5 py-1"
                      style={{
                        background: "rgba(245,158,11,0.12)",
                        color: "#8A5A00",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {request.role === "GATEKEEPER"
                        ? "Gestor de Inovação"
                        : "Avaliador"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDecision(request, "APPROVED")}
                      disabled={activeRequest !== null}
                      className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
                      style={{
                        background: "rgba(52,199,89,0.12)",
                        border: "none",
                        color: "#1F8A3B",
                        cursor: activeRequest ? "not-allowed" : "pointer",
                        fontSize: 12.5,
                        fontWeight: 600,
                      }}
                    >
                      <Check size={15} />
                      Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDecision(request, "REJECTED")}
                      disabled={activeRequest !== null}
                      className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
                      style={{
                        background: "#F0F0F2",
                        border: "none",
                        color: "#6E6E73",
                        cursor: activeRequest ? "not-allowed" : "pointer",
                        fontSize: 12.5,
                        fontWeight: 600,
                      }}
                    >
                      <X size={15} />
                      Rejeitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
