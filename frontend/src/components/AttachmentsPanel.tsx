import { useEffect, useRef, useState } from "react";
import { AlertCircle, Download, FileText, Image, Layers, Paperclip, Upload } from "lucide-react";
import type { Stage } from "../types";
import { ApiError } from "../lib/api";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_MB,
  MAX_FILES_PER_UPLOAD,
  downloadAttachment,
  listAttachments,
  uploadAttachments,
  validateFiles,
  type IdeaAttachment,
} from "../lib/attachments";

interface AttachmentsPanelProps {
  ideaId: string;
  token: string;
  onSessionExpired: () => void;
  /** Autor com a ideia fora de avaliação: pode anexar entregas (ACO-04) */
  canAttach?: boolean;
  /** Estágio atual, para o texto do botão de envio */
  stage?: Stage;
}

/** Anexos da submissão e entregas de cada estágio, agrupados por estágio (ACO-02) */
export default function AttachmentsPanel({ ideaId, token, onSessionExpired, canAttach, stage }: AttachmentsPanelProps) {
  const [items, setItems] = useState<IdeaAttachment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const expiredRef = useRef(onSessionExpired);
  expiredRef.current = onSessionExpired;

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    listAttachments(ideaId, token)
      .then((list) => !cancelled && setItems(list))
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return expiredRef.current();
        // 403: quem não vê o histórico da ideia também não vê os anexos
        setItems([]);
        if (err instanceof ApiError && err.status === 403) return;
        if (err instanceof ApiError && err.status === 0) {
          setError(err.message);
          return;
        }
        const status = err instanceof ApiError ? ` (HTTP ${err.status})` : "";
        setError(`Não foi possível carregar os anexos${status}.`);
      });
    return () => { cancelled = true; };
  }, [ideaId, token]);

  function handleError(err: unknown) {
    if (err instanceof ApiError && err.status === 401) return expiredRef.current();
    setError(err instanceof Error ? err.message : "Erro inesperado");
  }

  async function handleFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0) return;
    const invalid = validateFiles(files);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const created = await uploadAttachments(ideaId, files, token);
      setItems((prev) => [...(prev ?? []), ...created]);
    } catch (err) {
      handleError(err);
    } finally {
      setUploading(false);
    }
  }

  async function download(att: IdeaAttachment) {
    setError(null);
    try {
      await downloadAttachment(ideaId, att, token);
    } catch (err) {
      handleError(err);
    }
  }

  if (items === null) return null;
  if (items.length === 0 && !canAttach && !error) return null;

  // Agrupa por estágio, na ordem em que foram enviados
  const groups: { stage: Stage; items: IdeaAttachment[] }[] = [];
  for (const att of items) {
    const group = groups.find((g) => g.stage === att.stage);
    if (group) group.items.push(att);
    else groups.push({ stage: att.stage, items: [att] });
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3" style={{ marginBottom: 10 }}>
        <div className="flex items-center gap-1.5" style={{ color: "#6E6E73", fontSize: 12, fontWeight: 600 }}>
          <Paperclip size={13} />
          Anexos e entregas ({items.length})
        </div>
        {canAttach && (
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ALLOWED_EXTENSIONS.join(",")}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
              style={{
                background: "#FFF7E8",
                color: "#B6790A",
                border: "1px solid #FBD9AE",
                fontSize: 12,
                fontWeight: 600,
                cursor: uploading ? "not-allowed" : "pointer",
                opacity: uploading ? 0.7 : 1,
              }}
            >
              <Upload size={13} />
              {uploading ? "Enviando..." : stage ? `Anexar entrega (${stage})` : "Anexar arquivos"}
            </button>
          </>
        )}
      </div>

      {error && (
        <div
          className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 mb-2"
          style={{ color: "#FF3B30", fontSize: 12.5, background: "rgba(255,59,48,0.08)" }}
          role="alert"
        >
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {items.length === 0 && canAttach && (
        <p style={{ color: "#AEAEB2", fontSize: 12 }}>
          Nenhum arquivo ainda. Até {MAX_FILES_PER_UPLOAD} por envio, {MAX_FILE_MB} MB cada (imagens, PDF, Office, texto ou .zip).
        </p>
      )}

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.stage}>
            <div style={{ color: "#AEAEB2", fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
              {group.stage === "Ideação" ? "Ideação (submissão)" : group.stage}
            </div>
            <div className="flex flex-col gap-2">
              {group.items.map((att) => (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => download(att)}
                  title="Baixar"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 card-soft text-left"
                  style={{ background: "#FFFFFF", border: "none", cursor: "pointer" }}
                >
                  {att.kind === "image" ? (
                    <Image size={16} style={{ color: "#3B82F6" }} />
                  ) : att.kind === "prototype" ? (
                    <Layers size={16} style={{ color: "#8B7CF6" }} />
                  ) : (
                    <FileText size={16} style={{ color: "#2DD4BF" }} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate" style={{ color: "#1D1D1F", fontSize: 13 }}>{att.name}</div>
                    <div style={{ color: "#AEAEB2", fontSize: 11 }}>
                      {att.size} · {att.uploadedBy} · {new Date(att.date).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <Download size={14} style={{ color: "#AEAEB2" }} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
