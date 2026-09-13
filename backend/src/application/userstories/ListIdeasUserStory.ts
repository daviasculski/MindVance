import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IdeaOutputDTO } from "../dtos/IdeaDTO";

export class ListIdeasUserStory {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  async execute(): Promise<IdeaOutputDTO[]> {
    const ideas = await this.ideaRepository.findAll();

    return ideas.map((idea) => ({
      id: idea.id!,
      title: idea.title,
      description: idea.description,
      authorId: idea.authorId,
      extraFields: idea.extraFields ?? null,
      createdAt: idea.createdAt!,
      updatedAt: idea.updatedAt!,
    }));
  }
}
