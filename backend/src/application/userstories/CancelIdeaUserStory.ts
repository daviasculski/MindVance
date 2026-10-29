import { IdeaOutputDTO, RequesterDTO, toIdeaOutputDTO } from "../dtos/IdeaDTO";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";

export class CancelIdeaUserStory {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  async execute(id: string, requester: RequesterDTO): Promise<IdeaOutputDTO> {
    const idea = await this.ideaRepository.findById(id);

    if (!idea) {
      throw new Error("Ideia não encontrada");
    }

    const isAuthor = idea.authorId === requester.id;
    const canManage = requester.role === "GATEKEEPER" || requester.role === "ADMIN";
    if (!isAuthor && !canManage) {
      throw new Error("Only the author or a manager can cancel this idea");
    }

    if (idea.status === "CANCELLED") {
      throw new Error("Idea has already been cancelled");
    }

    const cancelledIdea = await this.ideaRepository.updateProgress(id, {
      status: "CANCELLED",
    });

    return toIdeaOutputDTO(cancelledIdea);
  }
}
