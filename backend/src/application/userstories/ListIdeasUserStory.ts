import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IdeaOutputDTO } from "../dtos/IdeaDTO";
import { ListIdeasFiltersDTO } from "../dtos/ListIdeasFiltersDTO";

export class ListIdeasUserStory {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  async execute(filters?: ListIdeasFiltersDTO): Promise<IdeaOutputDTO[]> {
    const ideas = await this.ideaRepository.findAll(filters);

    return ideas.map((idea) => ({
      id: idea.id!,
      title: idea.title,
      description: idea.description,
      authorId: idea.authorId,
      extraFields: idea.extraFields ?? null,
      currentStage: idea.currentStage,
      createdAt: idea.createdAt!,
      updatedAt: idea.updatedAt!,
    }));
  }
}
