import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { resetPassword } from "../lib/auth";

interface ResetPasswordProps {
  onBackToLogin: () => void;
}

export default function ResetPassword({ onBackToLogin }: ResetPasswordProps) {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("O link de redefinição está inválido ou incompleto.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F5F5F7" }}>
      <div className="w-full max-w-md rounded-2xl p-7 card-elevated" style={{ background: "#FFFFFF" }}>
        <div className="flex items-center justify-center gap-3 mb-7">
          <img
            src="/assets/aa.svg"
            alt=""
            className="h-10 w-auto object-contain"
          />
          <h1 style={{ color: "#0A1931", fontSize: 24, fontWeight: 700 }}>MindVance</h1>
        </div>

        {complete ? (
          <div className="text-center">
            <CheckCircle2 size={38} style={{ color: "#0072CE", margin: "0 auto 14px" }} />
            <h2 style={{ color: "#0A1931", fontSize: 18, fontWeight: 700 }}>Senha redefinida</h2>
            <p className="mt-2 mb-6" style={{ color: "#6E6E73", fontSize: 13 }}>
              Sua senha foi atualizada. Agora você já pode entrar na sua conta.
            </p>
            <button
              onClick={onBackToLogin}
              className="primary-action w-full py-3 rounded-xl font-semibold"
              style={{ border: "none", cursor: "pointer", fontSize: 14 }}
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ color: "#0A1931", fontSize: 19, fontWeight: 700 }}>Criar nova senha</h2>
            <p className="mt-2 mb-5" style={{ color: "#6E6E73", fontSize: 13 }}>
              Escolha uma senha com pelo menos 8 caracteres.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span style={{ color: "#6E6E73", fontSize: 12.5, fontWeight: 500 }}>Nova senha</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  style={inputStyle}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span style={{ color: "#6E6E73", fontSize: 12.5, fontWeight: 500 }}>Confirme a nova senha</span>
                <input
                  type="password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  style={inputStyle}
                />
              </label>
              {error && (
                <div className="flex items-center gap-1.5 rounded-xl px-3 py-2.5" style={{ color: "#B42318", fontSize: 12.5, background: "rgba(255,59,48,0.08)" }}>
                  <AlertCircle size={13} />
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="primary-action w-full py-3 rounded-xl font-semibold"
                style={{ border: "none", cursor: loading ? "wait" : "pointer", fontSize: 14 }}
              >
                {loading ? "Atualizando..." : "Redefinir senha"}
              </button>
              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full py-2"
                style={{ background: "none", border: "none", color: "#6E6E73", cursor: "pointer", fontSize: 13 }}
              >
                Voltar para o login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#F5F5F7",
  border: "1.5px solid transparent",
  borderRadius: 12,
  color: "#0A1931",
  fontSize: 13.5,
  padding: "10px 12px",
  outline: "none",
};
