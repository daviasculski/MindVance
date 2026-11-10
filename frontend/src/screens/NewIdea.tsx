import { useState } from "react";
import { Upload, AlertCircle, CheckCircle2, X, Paperclip } from "lucide-react";
import { departments } from "../data";
import GateBadge from "../components/GateBadge";
import GateRail from "../components/GateRail";
import { ApiError } from "../lib/api";
import { createIdea, stageFromApi, type ApiIdea } from "../lib/ideas";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_MB,
  MAX_FILES_PER_UPLOAD,
  formatSize,
  uploadAttachments,
  validateFiles,
} from "../lib/attachments";

interface NewIdeaProps {
  token: string;
  onSessionExpired: () => void;
  onViewMyIdeas: () => void;
  /** Departamento do cadastro, sugerido como área de origem */
  defaultDepartment?: string;
}

export default function NewIdea({ token, onSessionExpired, onViewMyIdeas, defaultDepartment = "" }: NewIdeaProps) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState<ApiIdea | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  /** A ideia foi criada, mas o envio dos anexos falhou */
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    problem: "",
    solution: "",
    department: defaultDepartment,
    impact: "",
    resources: "",
  });

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Título obrigatório";
    else if (form.title.trim().length > 255) e.title = "Título deve ter no máximo 255 caracteres";
    if (!form.problem.trim()) e.problem = "Descreva o problema identificado";
    if (!form.solution.trim()) e.solution = "Descreva a solução proposta";
    if (!form.department) e.department = "Selecione um departamento";
    return e;
  }

  function handleNext() {
    if (step === 1) {
      const e = validateStep1();
      if (Object.keys(e).length > 0) { setErrors(e); return; }
    }
    setStep((s) => s + 1);
    setErrors({});
  }

  // UC01 FA02: arquivo inválido é recusado aqui, sem perder os campos nem os outros arquivos
  function addFiles(list: FileList | null) {
    const picked = Array.from(list ?? []);
    if (picked.length === 0) return;
    const next = [...files, ...picked];
    const invalid = validateFiles(next);
    if (invalid) {
      setFileError(invalid);
      return;
    }
    setFileError(null);
    setFiles(next);
  }

  async function handleSubmit() {
    // Garante a validação mesmo se o usuário voltou ao passo 1 e apagou algo
    const e = validateStep1();
    if (Object.keys(e).length > 0) { setErrors(e); setStep(1); return; }

    if (validateFiles(files)) return;

    setLoading(true);
    setErrors({});
    setUploadWarning(null);
    try {
      const created = await createIdea(form, token);
      if (files.length > 0) {
        try {
          await uploadAttachments(created.id, files, token);
        } catch (err) {
          setUploadWarning(
            `A ideia foi submetida, mas os anexos não foram enviados (${err instanceof Error ? err.message : "erro inesperado"}). Anexe-os pelo detalhe da ideia.`,
          );
        }
      }
      setSubmitted(created);
      setFiles([]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }
      setErrors({ form: err instanceof Error ? err.message : "Erro inesperado" });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    const stage = stageFromApi[submitted.currentStage] ?? "Ideação";
    return (
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: "#F5F5F7" }}>
        <div className="text-center max-w-md">
          <div
            className="inline-flex items-center justify-center mb-6 rounded-full"
            style={{ width: 64, height: 64, background: "rgba(0,245,138,0.18)" }}
          >
            <CheckCircle2 size={30} style={{ color: "#0A1931" }} />
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0A1931", marginBottom: 12 }}>
            Ideia submetida!
          </h2>
          <p style={{ color: "#6E6E73", fontSize: 14, lineHeight: 1.6 }}>
            Sua ideia entrou no estágio <span style={{ color: "#0072CE", fontWeight: 600 }}>{stage}</span>. Você receberá uma notificação quando os avaliadores concluírem a análise.
          </p>
          {uploadWarning && (
            <div
              className="mt-4 flex items-start gap-1.5 rounded-xl px-3 py-2.5 text-left"
              style={{ color: "#0A1931", fontSize: 12.5, background: "rgba(0,180,216,0.12)" }}
              role="alert"
            >
              <AlertCircle size={13} style={{ marginTop: 2, flexShrink: 0 }} />
              {uploadWarning}
            </div>
          )}
          <div
            className="mt-6 p-4 text-left rounded-2xl card-soft"
            style={{ background: "#FFFFFF" }}
          >
            <div style={{ color: "#6E6E73", fontSize: 11, marginBottom: 8, fontWeight: 600 }}>IDEIA SUBMETIDA</div>
            <div style={{ color: "#0A1931", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
              {submitted.title}
            </div>
            <GateRail stage={stage} size="sm" />
            <div className="mt-3 flex items-center gap-2">
              <GateBadge label={`Gate 1 — ${stage}`} size="sm" />
              <span style={{ color: "#6E6E73", fontSize: 11 }}>Pendente de avaliação</span>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={onViewMyIdeas}
              className="px-6 py-2.5 rounded-xl font-medium"
              style={{ background: "#FFFFFF", color: "#0A1931", border: "1px solid #E5E5EA", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
            >
              Ver minhas ideias
            </button>
            <button
              onClick={() => { setSubmitted(null); setStep(1); setForm({ title: "", problem: "", solution: "", department: defaultDepartment, impact: "", resources: "" }); }}
              className="primary-action px-6 py-2.5 rounded-xl font-medium"
              style={{ border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
            >
              Submeter outra ideia
            </button>
          </div>
        </div>
      </div>
    );
  }

  const steps = ["Informações Básicas", "Detalhes e Impacto", "Anexos e Revisão"];

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: "#F5F5F7" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <GateBadge label="Entrará no Gate 1 — Ideação" />
          </div>
          <h1 style={{ fontWeight: 700, fontSize: 26, color: "#0A1931", letterSpacing: "-0.02em" }}>
            Submeter Nova Ideia
          </h1>
          <p style={{ color: "#6E6E73", fontSize: 14, marginTop: 6 }}>
            Preencha os campos abaixo. Sua ideia será avaliada por avaliadores designados antes de avançar no funil.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {steps.map((s, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center justify-center text-xs font-bold rounded-full"
                    style={{
                      width: 26,
                      height: 26,
                      background: done ? "#00F58A" : active ? "#00B4D8" : "#E5E5EA",
                      color: done || active ? "#0A1931" : "#6E6E73",
                      border: done || active ? "1px solid #0A1931" : "1px solid transparent",
                      flexShrink: 0,
                    }}
                  >
                    {done ? "✓" : n}
                  </div>
                  <span
                    style={{
                      fontSize: 12.5,
                      color: active ? "#0A1931" : "#6E6E73",
                      fontWeight: active ? 600 : 400,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="rounded-full"
                    style={{
                      height: 2,
                      width: 40,
                      background: step > n ? "#00F58A" : "#E5E5EA",
                      boxShadow: step > n ? "inset 0 0 0 1px #0A1931" : "none",
                      margin: "0 12px",
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <div className="p-6 rounded-2xl card-soft" style={{ background: "#FFFFFF" }}>
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <FormField label="Título da ideia *" error={errors.title} hint="Seja específico e direto. Ex: 'Automação do processo de aprovação de contratos'">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Ex: Plataforma de Onboarding Automatizado"
                  style={inp(!!errors.title)}
                />
              </FormField>
              <FormField label="Problema identificado *" error={errors.problem} hint="Descreva o problema com dados quantitativos quando possível">
                <textarea
                  value={form.problem}
                  onChange={(e) => set("problem", e.target.value)}
                  placeholder="O processo atual de X causa Y, resultando em Z..."
                  rows={4}
                  style={inp(!!errors.problem)}
                />
              </FormField>
              <FormField label="Solução proposta *" error={errors.solution}>
                <textarea
                  value={form.solution}
                  onChange={(e) => set("solution", e.target.value)}
                  placeholder="Proposta de solução que endereça o problema acima..."
                  rows={4}
                  style={inp(!!errors.solution)}
                />
              </FormField>
              <FormField label="Área / Departamento de origem *" error={errors.department}>
                <select
                  value={form.department}
                  onChange={(e) => set("department", e.target.value)}
                  style={{ ...inp(!!errors.department), appearance: "none" }}
                >
                  <option value="">Selecione seu departamento...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </FormField>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <FormField label="Impacto estimado" hint="Descreva o impacto esperado de forma qualitativa ou quantitativa">
                <textarea
                  value={form.impact}
                  onChange={(e) => set("impact", e.target.value)}
                  placeholder="Ex: Redução de 40% no tempo de X, economia de R$ Y/mês..."
                  rows={3}
                  style={inp(false)}
                />
              </FormField>
              <FormField label="Recursos necessários" hint="Pessoas, tecnologia, orçamento estimado">
                <textarea
                  value={form.resources}
                  onChange={(e) => set("resources", e.target.value)}
                  placeholder="Ex: 1 engenheiro sênior, 1 designer, orçamento de R$ X..."
                  rows={3}
                  style={inp(false)}
                />
              </FormField>

              {/* Stage preview */}
              <div
                className="p-4 rounded-2xl"
                style={{ background: "rgba(0,180,216,0.08)" }}
              >
                <div style={{ color: "#0072CE", fontSize: 11, fontWeight: 600, marginBottom: 10 }}>
                  ESTÁGIO DE ENTRADA
                </div>
                <div style={{ color: "#0A1931", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
                  Ideação
                </div>
                <GateRail stage="Ideação" size="sm" showLabels />
                <p style={{ color: "#6E6E73", fontSize: 12, marginTop: 12 }}>
                  Sua ideia entrará no primeiro estágio do funil Stage-Gate. Avaliadores designados irão pontuá-la nos próximos dias.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              {/* Upload area */}
              <div>
                <label style={{ color: "#6E6E73", fontSize: 12.5, fontWeight: 500, marginBottom: 8, display: "block" }}>
                  Anexos (opcional)
                </label>
                <label
                  className="w-full rounded-2xl flex flex-col items-center justify-center gap-2 py-8"
                  style={{ background: "#F5F5F7", border: "1.5px dashed #D2D2D7", color: "#6E6E73", cursor: "pointer" }}
                >
                  <input
                    type="file"
                    multiple
                    accept={ALLOWED_EXTENSIONS.join(",")}
                    className="hidden"
                    onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
                  />
                  <Upload size={22} style={{ color: "#0072CE" }} />
                  <span style={{ fontSize: 13, color: "#6E6E73" }}>Clique para escolher arquivos</span>
                  <span style={{ fontSize: 11, color: "#6E6E73" }}>
                    Imagens, PDF, Office, texto ou .zip · até {MAX_FILES_PER_UPLOAD} arquivos de {MAX_FILE_MB} MB
                  </span>
                </label>
                {fileError && (
                  <div className="mt-2 flex items-center gap-1.5" style={{ color: "#B42318", fontSize: 12 }} role="alert">
                    <AlertCircle size={12} />
                    {fileError}
                  </div>
                )}
                {files.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {files.map((file, i) => (
                      <div
                        key={`${file.name}-${i}`}
                        className="flex items-center gap-2 rounded-xl px-3 py-2"
                        style={{ background: "#FFFFFF", border: "1px solid #E5E5EA" }}
                      >
                        <Paperclip size={13} style={{ color: "#6E6E73" }} />
                        <span className="truncate flex-1" style={{ fontSize: 12.5, color: "#0A1931" }}>{file.name}</span>
                        <span style={{ fontSize: 11, color: "#6E6E73" }}>{formatSize(file.size)}</span>
                        <button
                          type="button"
                          aria-label={`Remover ${file.name}`}
                          onClick={() => { setFiles((list) => list.filter((_, j) => j !== i)); setFileError(null); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#6E6E73", padding: 2 }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="rounded-2xl p-4" style={{ background: "#F5F5F7" }}>
                <div style={{ color: "#6E6E73", fontSize: 11, marginBottom: 8, fontWeight: 600 }}>
                  REVISÃO DA SUBMISSÃO
                </div>
                <div style={{ color: "#0A1931", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                  {form.title || <span style={{ color: "#6E6E73" }}>Sem título</span>}
                </div>
                {form.department && (
                  <div style={{ color: "#6E6E73", fontSize: 13, marginBottom: 8 }}>
                    {form.department}
                  </div>
                )}
                {form.problem && (
                  <div style={{ color: "#6E6E73", fontSize: 13, lineHeight: 1.6 }}>
                    {form.problem.slice(0, 120)}{form.problem.length > 120 ? "..." : ""}
                  </div>
                )}
              </div>
            </div>
          )}

          {errors.form && (
            <div
              className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 mt-5"
              style={{ color: "#B42318", fontSize: 12.5, background: "rgba(255,59,48,0.08)" }}
            >
              <AlertCircle size={13} />
              {errors.form}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-5">
          <button
            onClick={() => step > 1 ? setStep((s) => s - 1) : undefined}
            disabled={step === 1}
            className="px-5 py-2.5 rounded-xl font-medium transition-all"
            style={{
              fontSize: 14,
              background: step === 1 ? "transparent" : "#F5F5F7",
              color: step === 1 ? "#D2D2D7" : "#6E6E73",
              border: "none",
              cursor: step === 1 ? "not-allowed" : "pointer",
            }}
          >
            Voltar
          </button>
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="primary-action px-6 py-2.5 rounded-xl font-semibold transition-all"
              style={{
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="primary-action px-6 py-2.5 rounded-xl font-semibold transition-all"
              style={{
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Submetendo..." : "Submeter Ideia"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function inp(err: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: "#F5F5F7",
    border: `1.5px solid ${err ? "#B42318" : "transparent"}`,
    borderRadius: 12,
    color: "#0A1931",
    fontSize: 13.5,
    padding: "10px 12px",
    outline: "none",
    resize: "vertical",
  };
}

function FormField({
  label, error, hint, children,
}: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ color: "#6E6E73", fontSize: 12.5, fontWeight: 500 }}>
        {label}
      </label>
      {hint && (
        <p style={{ color: "#6E6E73", fontSize: 11.5, marginTop: -4 }}>{hint}</p>
      )}
      {children}
      {error && (
        <div className="flex items-center gap-1.5" style={{ color: "#B42318", fontSize: 12 }}>
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
}
