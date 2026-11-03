import { useState } from "react";
import { Eye, EyeOff, AlertCircle, X } from "lucide-react";
import iconImg from "../../public/assets/logo-light.png";
import logoTextImg from "../../public/assets/mindvance_logo2.png";
import type { AuthSession, Role } from "../types";
import { departments } from "../data";
import { login, register, requestPasswordReset } from "../lib/auth";
import { ApiError } from "../lib/api";

interface LoginProps {
  onLogin: (session: AuthSession) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [role, setRole] = useState<Role>("colaborador");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState<{ pendingApproval: boolean; message: string } | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  function validate() {
    const e: Record<string, string> = {};
    if (!email) e.email = "E-mail obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "E-mail inválido";
    if (!password) e.password = "Senha obrigatória";
    else if (password.length < 6) e.password = "Senha deve ter ao menos 6 caracteres";
    if (mode === "register") {
      if (!name.trim()) e.name = "Nome obrigatório";
      if (role === "colaborador" && !dept) e.dept = "Selecione um departamento";
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    setNotice("");
    try {
      if (mode === "register") {
        const result = await register({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        });
        setRegistrationSuccess(result);
        setMode("login");
        setPassword("");
        window.history.replaceState(null, "", "/login");
        setLoading(false);
        return;
      }
      onLogin(await login(email.trim(), password));
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 403 &&
        (err.message === "Sua conta ainda está aguardando aprovação de um administrador." ||
          err.message === "Sua solicitação de cadastro foi recusada pelo administrador.")
      ) {
        setErrors({ form: err.message });
      } else {
        setErrors({ form: err instanceof Error ? err.message : "Erro inesperado" });
      }
      setLoading(false);
    }
  }

  function closeRegistrationSuccess() {
    setRegistrationSuccess(null);
    setMode("login");
    setPassword("");
    setErrors({});
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage("");
    setForgotError("");
    try {
      const result = await requestPasswordReset(forgotEmail.trim());
      setForgotMessage(result.message);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setForgotError("E-mail não cadastrado no sistema.");
      } else {
        setForgotError(err instanceof Error ? err.message : "Não foi possível solicitar a redefinição.");
      }
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ background: "#F5F5F7" }}
    >
      <div className="absolute inset-0 pointer-events-none blueprint-grid" />

      <div className="relative w-full max-w-sm px-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img
            src={iconImg}
            alt="MindVance Ícone"
            className="h-28 w-auto object-contain"
          />
          <img
            src={logoTextImg}
            alt="MindVance"
            className="h-28-auto object-contain"
          />
        </div>
        <p style={{ color: "#6E6E73", fontSize: 13, marginTop: 6 }}>
          Gestão da inovação com Stage-Gate
        </p>
      </div>

        {/* Card */}
        <div
          className="p-6 rounded-2xl card-elevated"
          style={{ background: "#FFFFFF" }}
        >
          {/* Tabs */}
          <div
            className="flex mb-6 rounded-xl"
            style={{ background: "#F5F5F7", padding: 3 }}
          >
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErrors({}); setNotice(""); }}
                className="flex-1 py-2 text-sm font-medium transition-all rounded-lg"
                style={{
                  fontWeight: 500,
                  fontSize: 13,
                  background: mode === m ? "#FFFFFF" : "transparent",
                  color: mode === m ? "#1D1D1F" : "#6E6E73",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <Field label="Nome completo" error={errors.name}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Carla Mendes"
                  style={inputStyle(!!errors.name)}
                />
              </Field>
            )}

            <Field label="E-mail corporativo" error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                style={inputStyle(!!errors.email)}
              />
            </Field>

            <Field label="Senha" error={errors.password}>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle(!!errors.password), paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#AEAEB2", background: "none", border: "none", cursor: "pointer" }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotMessage("");
                  setForgotError("");
                  setForgotOpen(true);
                }}
                className="self-end"
                style={{ color: "#B6790A", background: "none", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, padding: 0 }}
              >
                Esqueci minha senha
              </button>
            )}

            {/* O perfil público permite solicitar apenas papéis não administrativos. */}
            {mode === "register" && (
              <Field label="Perfil de acesso">
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as Role);
                    setErrors(({ dept: _, ...rest }) => rest);
                  }}
                  style={{ ...inputStyle(false), appearance: "none" }}
                >
                  <option value="colaborador">Colaborador</option>
                  <option value="avaliador">Avaliador</option>
                  <option value="gatekeeper">Gestor de Inovação</option>
                </select>
                {role !== "colaborador" && (
                  <p style={{ color: "#AEAEB2", fontSize: 11.5, lineHeight: 1.5 }}>
                    Este perfil depende da aprovação de um Administrador. Até lá, você entra como Colaborador.
                  </p>
                )}
              </Field>
            )}

            {/* Só colaboradores pertencem a um departamento */}
            {mode === "register" && role === "colaborador" && (
              <Field label="Departamento" error={errors.dept}>
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  style={{ ...inputStyle(!!errors.dept), appearance: "none" }}
                >
                  <option value="">Selecione...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </Field>
            )}

            {errors.form && (
              <div
                className="flex items-center gap-1.5 rounded-xl px-3 py-2.5"
                style={{ color: "#FF3B30", fontSize: 12.5, background: "rgba(255,59,48,0.08)" }}
              >
                <AlertCircle size={13} />
                {errors.form}
              </div>
            )}

            {notice && (
              <div
                className="rounded-xl px-3 py-2.5"
                style={{ color: "#8A5A00", fontSize: 12.5, background: "rgba(245,158,11,0.12)" }}
                role="status"
              >
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold transition-all mt-1"
              style={{
                fontWeight: 600,
                fontSize: 14,
                background: loading ? "#FBD9AE" : "#F59E0B",
                color: "#FFFFFF",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? "Verificando..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>

        <p
          className="text-center mt-4"
          style={{ color: "#AEAEB2", fontSize: 12 }}
        >
          Acesso restrito a colaboradores autorizados
        </p>
      </div>
      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(29,29,31,0.45)" }}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !forgotLoading) setForgotOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl p-6 card-elevated"
            style={{ background: "#FFFFFF" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
          >
            <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="absolute right-4 top-4"
              style={{ color: "#8E8E93", background: "none", border: "none", cursor: "pointer" }}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
            <h2 id="forgot-password-title" style={{ color: "#1D1D1F", fontSize: 19, fontWeight: 700 }}>
              Recuperar senha
            </h2>
            <p className="mt-2 mb-5" style={{ color: "#6E6E73", fontSize: 13, lineHeight: 1.5 }}>
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
              <Field label="E-mail corporativo">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  autoComplete="email"
                  style={inputStyle(false)}
                />
              </Field>
              {forgotError && (
                <div className="flex items-center gap-1.5 rounded-xl px-3 py-2.5" style={{ color: "#FF3B30", fontSize: 12.5, background: "rgba(255,59,48,0.08)" }}>
                  <AlertCircle size={13} />
                  {forgotError}
                </div>
              )}
              {forgotMessage && (
                <p role="status" className="rounded-xl px-3 py-2.5" style={{ color: "#1F8A3B", fontSize: 12.5, background: "rgba(52,199,89,0.1)" }}>
                  {forgotMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-3 rounded-xl font-semibold"
                style={{ background: forgotLoading ? "#FBD9AE" : "#F59E0B", color: "#FFFFFF", border: "none", cursor: forgotLoading ? "wait" : "pointer", fontSize: 14 }}
              >
                {forgotLoading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>
          </div>
        </div>
      )}
      {registrationSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(29,29,31,0.45)" }}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRegistrationSuccess();
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 card-elevated"
            style={{ background: "#FFFFFF" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-success-title"
          >
            <h2 id="registration-success-title" style={{ color: "#1D1D1F", fontSize: 19, fontWeight: 700 }}>
              {registrationSuccess.pendingApproval ? "Solicitação enviada" : "Conta criada"}
            </h2>
            <p className="mt-3 mb-6" style={{ color: "#6E6E73", fontSize: 13, lineHeight: 1.55 }}>
              {registrationSuccess.pendingApproval
                ? "Solicitação de cadastro enviada com sucesso! Um administrador analisará seu perfil antes da liberação do acesso."
                : "Conta criada com sucesso! Você já pode fazer login."}
            </p>
            <button
              type="button"
              onClick={closeRegistrationSuccess}
              className="w-full py-3 rounded-xl font-semibold"
              style={{ background: "#F59E0B", color: "#FFFFFF", border: "none", cursor: "pointer", fontSize: 14 }}
            >
              Ir para o login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function inputStyle(hasError: boolean) {
  return {
    width: "100%",
    background: "#F5F5F7",
    border: `1.5px solid ${hasError ? "#FF3B30" : "transparent"}`,
    borderRadius: 12,
    color: "#1D1D1F",
    fontSize: 13.5,
    padding: "10px 12px",
    outline: "none",
  } as React.CSSProperties;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ color: "#6E6E73", fontSize: 12.5, fontWeight: 500 }}>
        {label}
      </label>
      {children}
      {error && (
        <div className="flex items-center gap-1.5" style={{ color: "#FF3B30", fontSize: 12 }}>
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
}
