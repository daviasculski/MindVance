import { Idea, IdeaProps } from "../entities/Idea";
import { IdeaStage } from "../entities/IdeaStage";

export type UpdateIdeaData = Partial<
  Omit<IdeaProps, "id" | "createdAt" | "updatedAt" | "currentStage">
>;

export interface IdeaFilters {
  stage?: string;
  startDate?: string;
  endDate?: string;
}

export interface IIdeaRepository {
  create(idea: Idea): Promise<Idea>;
  findById(id: string): Promise<Idea | null>;
  findAll(filters?: IdeaFilters): Promise<Idea[]>;
  update(id: string, data: UpdateIdeaData): Promise<Idea>;
  updateStage(id: string, stage: IdeaStage): Promise<Idea>;
  delete(id: string): Promise<void>;
}
