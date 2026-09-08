import { Idea } from "../entities/Idea";

export interface IIdeaRepository {
  create(idea: Idea): Promise<Idea>;
  findById(id: string): Promise<Idea | null>;
  findAll(): Promise<Idea[]>;
}
