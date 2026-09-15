import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IdeaOutputDTO, UpdateIdeaInputDTO } from "../dtos/IdeaDTO";

export class UpdateIdeaUserStory {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  async execute(id: string, data: UpdateIdeaInputDTO): Promise<IdeaOutputDTO> {
    const existingIdea = await this.ideaRepository.findById(id);

    if (!existingIdea) {
      throw new Error("Ideia não encontrada");
    }

    const updatedIdea = await this.ideaRepository.update(id, data);

    return {
      id: updatedIdea.id!,
      title: updatedIdea.title,
      description: updatedIdea.description,
      authorId: updatedIdea.authorId,
      extraFields: updatedIdea.extraFields ?? null,
      createdAt: updatedIdea.createdAt!,
      updatedAt: updatedIdea.updatedAt!,
    };
  }
}
