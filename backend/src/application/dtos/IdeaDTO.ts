import { IdeaStage } from "../../domain/entities/IdeaStage";

export interface CreateIdeaInputDTO {
  title: string;
  description: string;
  authorId: string;
  extraFields?: Record<string, unknown>;
}

export interface UpdateIdeaInputDTO {
  title?: string;
  description?: string;
  authorId?: string;
  extraFields?: Record<string, unknown> | null;
}

export interface IdeaOutputDTO {
  id: string;
  title: string;
  description: string;
  authorId: string;
  extraFields: Record<string, unknown> | null;
  currentStage: IdeaStage;
  createdAt: Date;
  updatedAt: Date;
}
