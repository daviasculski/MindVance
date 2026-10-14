import { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import type { Role } from "../types";
import { departments } from "../data";

interface LoginProps {
  onLogin: (role: Role) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("ana.lira@empresa.com");
  const [password, setPassword] = useState("senha123");
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [role, setRole] = useState<Role>("colaborador");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!email) e.email = "E-mail obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "E-mail inválido";
    if (!password) e.password = "Senha obrigatória";
    else if (password.length < 6) e.password = "Senha deve ter ao menos 6 caracteres";
    if (mode === "register") {
      if (!name.trim()) e.name = "Nome obrigatório";
      if (!dept) e.dept = "Selecione um departamento";
    }
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    setTimeout(() => { setLoading(false); onLogin(role); }, 900);
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
          <img src="/assets/logo-dark.svg" alt="" width={40} height={40} style={{ marginBottom: 16 }} />
          <h1
            style={{
              fontWeight: 700,
              fontSize: 28,
              color: "#1D1D1F",
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            IMS
          </h1>
          <p style={{ color: "#6E6E73", fontSize: 13, marginTop: 6 }}>
            Innovation Management System
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
                onClick={() => { setMode(m); setErrors({}); }}
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

            {mode === "register" && (
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

            {/* Role selector for demo */}
            <Field label="Perfil de acesso (demo)">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                style={{ ...inputStyle(false), appearance: "none" }}
              >
                <option value="colaborador">Colaborador</option>
                <option value="avaliador">Avaliador</option>
                <option value="administrador">Administrador</option>
              </select>
            </Field>

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
