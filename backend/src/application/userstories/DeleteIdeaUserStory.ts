import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { RequesterDTO } from "../dtos/IdeaDTO";

export class DeleteIdeaUserStory {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  async execute(id: string, requester: RequesterDTO): Promise<void> {
    const existingIdea = await this.ideaRepository.findById(id);

    if (!existingIdea) {
      throw new Error("Ideia não encontrada");
    }

    // O administrador pode excluir sempre; o autor, só enquanto está na Ideação
    if (requester.role !== "ADMIN") {
      if (existingIdea.authorId !== requester.id) {
        throw new Error("Only the author or an admin can delete this idea");
      }

      if (existingIdea.currentStage !== "IDEACAO") {
        throw new Error("Authors can only delete ideas still in Ideation");
      }
    }

    await this.ideaRepository.delete(id);
  }
}
