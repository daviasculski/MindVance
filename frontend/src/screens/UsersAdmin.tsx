import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, RefreshCw, Users } from "lucide-react";
import type { ApiRole } from "../types";
import { ApiError } from "../lib/api";
import { changeUserRole, listUsers, roleLabels, type ManagedUser } from "../lib/auth";

interface UsersAdminProps {
  token: string;
  currentUserId: string;
  onSessionExpired: () => void;
}

const roles: ApiRole[] = ["COLLABORATOR", "EVALUATOR", "GATEKEEPER", "ADMIN"];

const statusLabel: Record<ManagedUser["approvalStatus"], { text: string; color: string; bg: string }> = {
  PENDING: { text: "pedido pendente", color: "#8A5A00", bg: "rgba(245,158,11,0.12)" },
  REJECTED: { text: "pedido recusado", color: "#6E6E73", bg: "#F0F0F2" },
  APPROVED: { text: "", color: "", bg: "" },
};

/** Administrador: lista de usuários e atribuição de papel (P1). Os pedidos pendentes ficam em Solicitações. */
export default function UsersAdmin({ token, currentUserId, onSessionExpired }: UsersAdminProps) {
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const sessionExpiredRef = useRef(onSessionExpired);
  sessionExpiredRef.current = onSessionExpired;

  const load = useCallback(async () => {
    setError(null);
    try {
      setUsers(await listUsers(token));
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

  async function handleChange(user: ManagedUser, role: ApiRole) {
    setSaving(user.id);
    setRowError(null);
    try {
      const updated = await changeUserRole(user.id, role, token);
      setUsers((prev) => prev?.map((u) => (u.id === updated.id ? updated : u)) ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        sessionExpiredRef.current();
        return;
      }
      setRowError({ id: user.id, message: err instanceof Error ? err.message : "Erro inesperado" });
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="flex-1 overflow-y-auto p-8" style={{ background: "#F5F5F7" }}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 style={{ color: "#1D1D1F", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Usuários</h1>
            <p style={{ color: "#6E6E73", fontSize: 13, marginTop: 5 }}>
              Altere o papel de qualquer usuário. A mudança vale no próximo acesso dele e aprova a conta.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5"
            style={{ background: "#FFFFFF", border: "1px solid #E5E5EA", color: "#6E6E73", cursor: "pointer", fontSize: 13 }}
          >
            <RefreshCw size={15} />
            Atualizar
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl card-elevated" style={{ background: "#FFFFFF" }}>
          {error ? (
            <div className="p-6">
              <p className="mb-4" role="alert" style={{ color: "#C62828", fontSize: 14 }}>{error}</p>
              <button type="button" onClick={() => void load()} style={{ color: "#8A5A00", fontSize: 13 }}>
                Tentar novamente
              </button>
            </div>
          ) : !users ? (
            <p className="p-6" style={{ color: "#6E6E73", fontSize: 14 }}>Carregando usuários...</p>
          ) : users.length === 0 ? (
            <div className="p-10 text-center">
              <Users size={28} style={{ color: "#AEAEB2", margin: "0 auto 12px" }} />
              <p style={{ color: "#1D1D1F", fontSize: 15, fontWeight: 600 }}>Nenhum usuário cadastrado</p>
            </div>
          ) : (
            <ul>
              {users.map((user, index) => {
                const status = statusLabel[user.approvalStatus];
                const isSelf = user.id === currentUserId;
                return (
                  <li
                    key={user.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-5"
                    style={{ borderBottom: index < users.length - 1 ? "1px solid #F0F0F2" : "none" }}
                  >
                    <div className="min-w-0">
                      <p className="truncate" style={{ color: "#1D1D1F", fontSize: 14, fontWeight: 600 }}>
                        {user.name}
                        {isSelf && <span style={{ color: "#AEAEB2", fontWeight: 400 }}> (você)</span>}
                      </p>
                      <p className="truncate" style={{ color: "#6E6E73", fontSize: 12.5, marginTop: 3 }}>{user.email}</p>
                      {user.approvalStatus !== "APPROVED" && (
                        <span
                          className="mt-2 inline-flex rounded-full px-2.5 py-1"
                          style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 600 }}
                        >
                          {roleLabels[user.role]}: {status.text} · opera como {roleLabels[user.effectiveRole]}
                        </span>
                      )}
                      {rowError?.id === user.id && (
                        <p className="flex items-center gap-1.5 mt-2" style={{ color: "#FF3B30", fontSize: 12 }}>
                          <AlertCircle size={12} />
                          {rowError.message}
                        </p>
                      )}
                    </div>
                    <select
                      value={user.effectiveRole}
                      disabled={isSelf || saving !== null}
                      onChange={(e) => void handleChange(user, e.target.value as ApiRole)}
                      title={isSelf ? "Você não pode alterar o próprio papel" : "Alterar papel"}
                      style={{
                        background: "#F5F5F7",
                        border: "1.5px solid transparent",
                        borderRadius: 12,
                        color: "#1D1D1F",
                        fontSize: 13,
                        padding: "8px 12px",
                        cursor: isSelf ? "not-allowed" : "pointer",
                        opacity: saving === user.id ? 0.6 : 1,
                      }}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>{roleLabels[r]}</option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
