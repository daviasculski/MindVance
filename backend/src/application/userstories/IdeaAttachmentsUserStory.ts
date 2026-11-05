import { Attachment } from "../../domain/entities/Attachment";
import { Idea } from "../../domain/entities/Idea";
import { IdeaStage } from "../../domain/entities/IdeaStage";
import { IAttachmentRepository } from "../../domain/repositories/IAttachmentRepository";
import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { RequesterDTO } from "../dtos/IdeaDTO";
import { canViewIdeaHistory } from "../policies/ideaHistoryAccess";
import { editableStatuses } from "./UpdateIdeaUserStory";

/** Arquivo já gravado no diretório de uploads */
export interface UploadedFileDTO {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
}

export interface AttachmentOutputDTO {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  stage: IdeaStage;
  uploadedById: string;
  uploadedByName: string;
  createdAt: Date;
}

/** Anexos da submissão e entregas de cada estágio (SUB-02, ACO-02, ACO-04) */
export class IdeaAttachmentsUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly gateReviewRepository: IGateReviewRepository,
    private readonly attachmentRepository: IAttachmentRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  /** Só o autor anexa, e só quando a ideia pode ser editada (fora de avaliação) */
  async upload(ideaId: string, files: UploadedFileDTO[], requester: RequesterDTO): Promise<AttachmentOutputDTO[]> {
    if (files.length === 0) {
      throw new Error("At least one file is required");
    }

    const idea = await this.findIdea(ideaId);
    if (idea.authorId !== requester.id) {
      throw new Error("Only the author can attach files");
    }
    if (idea.currentStage === "LANCAMENTO" || !editableStatuses.includes(idea.status)) {
      throw new Error("Files can only be attached before triage, between gates or after revision");
    }

    const created = await this.attachmentRepository.createMany(
      files.map((file) => ({
        ideaId,
        uploadedById: requester.id,
        stage: idea.currentStage,
        fileName: file.originalName,
        storedName: file.storedName,
        mimeType: file.mimeType,
        size: file.size,
      })),
    );
    return this.toOutput(created);
  }

  async list(ideaId: string, requester: RequesterDTO): Promise<AttachmentOutputDTO[]> {
    const idea = await this.findIdea(ideaId);
    await this.ensureCanView(idea, requester);
    return this.toOutput(await this.attachmentRepository.findByIdea(ideaId));
  }

  /** Metadados para o download; o arquivo é lido pela camada de apresentação */
  async getForDownload(ideaId: string, attachmentId: string, requester: RequesterDTO): Promise<Attachment> {
    const idea = await this.findIdea(ideaId);
    await this.ensureCanView(idea, requester);
    const attachment = await this.attachmentRepository.findById(attachmentId);
    if (!attachment || attachment.ideaId !== ideaId) {
      throw new Error("Attachment not found");
    }
    return attachment;
  }

  private async findIdea(id: string): Promise<Idea> {
    const idea = await this.ideaRepository.findById(id);
    if (!idea) {
      throw new Error("Ideia não encontrada");
    }
    return idea;
  }

  // Mesma regra do detalhe da ideia: autor, Gestor e designados; o Mural (Lançamento) é público
  private async ensureCanView(idea: Idea, requester: RequesterDTO): Promise<void> {
    if (idea.currentStage === "LANCAMENTO") return;
    const reviews = await this.gateReviewRepository.findByIdea(idea.id!);
    if (!canViewIdeaHistory(idea, reviews, requester)) {
      throw new Error("You cannot view this idea");
    }
  }

  private async toOutput(attachments: Attachment[]): Promise<AttachmentOutputDTO[]> {
    const users = await this.userRepository.findByIds([...new Set(attachments.map((a) => a.uploadedById))]);
    const nameById = new Map(users.map((u) => [u.id, u.name]));
    return attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      size: a.size,
      stage: a.stage,
      uploadedById: a.uploadedById,
      uploadedByName: nameById.get(a.uploadedById) ?? "Colaborador",
      createdAt: a.createdAt,
    }));
  }
}
