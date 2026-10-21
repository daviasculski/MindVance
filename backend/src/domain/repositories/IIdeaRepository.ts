import { Idea, IdeaProps } from "../entities/Idea";
import { IdeaStage } from "../entities/IdeaStage";
import { IdeaStatus } from "../entities/IdeaStatus";

// O autor nunca muda; estágio e status só mudam por decisão de gate
export type UpdateIdeaData = Partial<
  Omit<
    IdeaProps,
    "id" | "authorId" | "createdAt" | "updatedAt" | "currentStage" | "status"
  >
>;

export interface IdeaProgressData {
  currentStage?: IdeaStage;
  status?: IdeaStatus;
}

export interface IdeaFilters {
  stage?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  authorId?: string;
}

export interface IIdeaRepository {
  create(idea: Idea): Promise<Idea>;
  findById(id: string): Promise<Idea | null>;
  findAll(filters?: IdeaFilters): Promise<Idea[]>;
  update(id: string, data: UpdateIdeaData): Promise<Idea>;
  updateProgress(id: string, data: IdeaProgressData): Promise<Idea>;
  /** Remove a ideia junto com suas avaliações e decisões de gate */
  delete(id: string): Promise<void>;
}
