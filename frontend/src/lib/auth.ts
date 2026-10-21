import type { ApiRole, AuthSession, AuthUser, Role } from "../types";
import { ApiError, apiRequest } from "./api";

const STORAGE_KEY = "ims.session";

const roleFromApi: Record<ApiRole, Role> = {
  COLLABORATOR: "colaborador",
  EVALUATOR: "avaliador",
  GESTOR_INOVACAO: "gestor-inovacao",
  ADMIN: "administrador",
};

const roleToApi: Record<Role, ApiRole> = {
  colaborador: "COLLABORATOR",
  avaliador: "EVALUATOR",
  "gestor-inovacao": "GESTOR_INOVACAO",
  administrador: "ADMIN",
};

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: ApiRole;
}

function toAuthUser(user: ApiUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: roleFromApi[user.role] ?? "colaborador",
  };
}

export async function login(email: string, password: string): Promise<AuthSession> {
  try {
    const data = await apiRequest<{ token: string; user: ApiUser }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    const session = { token: data.token, user: toAuthUser(data.user) };
    saveSession(session);
    return session;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw new ApiError(401, "E-mail ou senha incorretos");
    }
    if (error instanceof ApiError && error.status === 403) {
      throw new ApiError(
        403,
        "Sua conta aguarda aprovação ou teve o acesso negado.",
      );
    }
    throw error;
  }
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}): Promise<{ approvalStatus: "PENDING" | "APPROVED" | "REJECTED" }> {
  try {
    return await apiRequest<{ approvalStatus: "PENDING" | "APPROVED" | "REJECTED" }>("/users", {
      method: "POST",
      body: { ...input, role: roleToApi[input.role] },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      throw new ApiError(409, "Este e-mail já está cadastrado");
    }
    throw error;
  }
}

function tokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (!session.token || !session.user || tokenExpired(session.token)) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // sem storage disponível: a sessão vale só enquanto a página estiver aberta
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
