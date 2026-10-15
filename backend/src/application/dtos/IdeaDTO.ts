import { Idea } from "../../domain/entities/Idea";
import { IdeaStage } from "../../domain/entities/IdeaStage";
import { IdeaStatus } from "../../domain/entities/IdeaStatus";
import { UserRole } from "../../domain/entities/UserRole";

export interface CreateIdeaInputDTO {
  title: string;
  description: string;
  authorId: string;
  extraFields?: Record<string, unknown>;
}

// authorId não é editável: o autor é sempre quem criou a ideia
export interface UpdateIdeaInputDTO {
  title?: string;
  description?: string;
  extraFields?: Record<string, unknown> | null;
}

/** Quem está fazendo a requisição (vem do token JWT) */
export interface RequesterDTO {
  id: string;
  role: UserRole | undefined;
}

export interface IdeaOutputDTO {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName?: string;
  extraFields: Record<string, unknown> | null;
  currentStage: IdeaStage;
  status: IdeaStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toIdeaOutputDTO(idea: Idea, authorName?: string): IdeaOutputDTO {
  return {
    id: idea.id!,
    title: idea.title,
    description: idea.description,
    authorId: idea.authorId,
    ...(authorName !== undefined ? { authorName } : {}),
    extraFields: idea.extraFields ?? null,
    currentStage: idea.currentStage,
    status: idea.status,
    createdAt: idea.createdAt!,
    updatedAt: idea.updatedAt!,
  };
}
