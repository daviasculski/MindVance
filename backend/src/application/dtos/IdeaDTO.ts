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
  createdAt: Date;
  updatedAt: Date;
}
