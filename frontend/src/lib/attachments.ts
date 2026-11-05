import type { Stage } from "../types";
import { API_URL, ApiError, apiRequest } from "./api";
import { stageFromApi, type ApiStage } from "./ideas";

export interface ApiAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  stage: ApiStage;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
}

export interface IdeaAttachment {
  id: string;
  name: string;
  kind: "image" | "document" | "prototype";
  size: string;
  /** Estágio em que foi enviado: submissão (Ideação) ou entrega de um estágio */
  stage: Stage;
  uploadedBy: string;
  date: string;
}

// Mesmas regras do backend (INF-04); o backend valida de novo
export const MAX_FILE_MB = 10;
export const MAX_FILES_PER_UPLOAD = 5;
export const ALLOWED_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".webp",
  ".pdf", ".txt", ".csv",
  ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".odt", ".ods", ".odp",
  ".zip",
];

const uploadErrors: Record<string, string> = {
  "File type not allowed": "Tipo de arquivo não permitido.",
  "File exceeds the size limit": `Cada arquivo pode ter no máximo ${MAX_FILE_MB} MB.`,
  "Too many files": `Envie no máximo ${MAX_FILES_PER_UPLOAD} arquivos por vez.`,
  "Files can only be attached before triage, between gates or after revision":
    "Não é possível anexar enquanto a ideia está em avaliação.",
  "Only the author can attach files": "Só o autor pode anexar arquivos.",
};

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

/** UC01 FA02: valida antes de enviar, sem perder o que já foi preenchido */
export function validateFiles(files: File[]): string | null {
  if (files.length > MAX_FILES_PER_UPLOAD) return uploadErrors["Too many files"];
  const invalidType = files.find((f) => !ALLOWED_EXTENSIONS.includes(extensionOf(f.name)));
  if (invalidType) return `"${invalidType.name}": tipo de arquivo não permitido.`;
  const tooBig = files.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
  if (tooBig) return `"${tooBig.name}" passa de ${MAX_FILE_MB} MB.`;
  return null;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function toAttachment(a: ApiAttachment): IdeaAttachment {
  const ext = extensionOf(a.fileName);
  return {
    id: a.id,
    name: a.fileName,
    kind: a.mimeType.startsWith("image/") ? "image" : ext === ".zip" ? "prototype" : "document",
    size: formatSize(a.size),
    stage: stageFromApi[a.stage],
    uploadedBy: a.uploadedByName,
    date: a.createdAt,
  };
}

export async function listAttachments(ideaId: string, token: string): Promise<IdeaAttachment[]> {
  const list = await apiRequest<ApiAttachment[]>(`/ideas/${encodeURIComponent(ideaId)}/attachments`, { token });
  return list.map(toAttachment);
}

export async function uploadAttachments(ideaId: string, files: File[], token: string): Promise<IdeaAttachment[]> {
  const body = new FormData();
  files.forEach((f) => body.append("files", f));
  let response: Response;
  try {
    response = await fetch(`${API_URL}/ideas/${encodeURIComponent(ideaId)}/attachments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data.error === "string" ? data.error : "Erro inesperado";
    throw new ApiError(response.status, uploadErrors[message] ?? message);
  }
  return (data as ApiAttachment[]).map(toAttachment);
}

/** Baixa com o token (o link direto não levaria o cabeçalho de autenticação) */
export async function downloadAttachment(ideaId: string, attachment: IdeaAttachment, token: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(
      `${API_URL}/ideas/${encodeURIComponent(ideaId)}/attachments/${encodeURIComponent(attachment.id)}/download`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, data?.error ?? "Não foi possível baixar o arquivo");
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = attachment.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
