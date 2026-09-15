import { Idea, IdeaProps } from "../entities/Idea";

export type UpdateIdeaData = Partial<Omit<IdeaProps, "id" | "createdAt" | "updatedAt">>;

export interface IIdeaRepository {
  create(idea: Idea): Promise<Idea>;
  findById(id: string): Promise<Idea | null>;
  findAll(): Promise<Idea[]>;
  update(id: string, data: UpdateIdeaData): Promise<Idea>;
}
