import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IdeaOutputDTO } from "../dtos/IdeaDTO";

export class GetIdeaByIdUserStory {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  async execute(id: string): Promise<IdeaOutputDTO> {
    const idea = await this.ideaRepository.findById(id);

    if (!idea) {
      throw new Error("Ideia não encontrada");
    }

    return {
      id: idea.id!,
      title: idea.title,
      description: idea.description,
      authorId: idea.authorId,
      extraFields: idea.extraFields ?? null,
      currentStage: idea.currentStage,
      createdAt: idea.createdAt!,
      updatedAt: idea.updatedAt!,
    };
  }
}
