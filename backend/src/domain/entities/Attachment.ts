import { IdeaStage } from "./IdeaStage";

/** Anexo da ideia ou entrega de um estágio (SUB-02, ACO-04) */
export interface Attachment {
  id: string;
  ideaId: string;
  uploadedById: string;
  /** Estágio da ideia no momento do envio */
  stage: IdeaStage;
  fileName: string;
  /** Nome do arquivo no diretório de uploads */
  storedName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

export type NewAttachment = Omit<Attachment, "id" | "createdAt">;
