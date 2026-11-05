import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { canViewIdeaHistory } from "../policies/ideaHistoryAccess";
import { IdeaOutputDTO, RequesterDTO, toIdeaOutputDTO } from "../dtos/IdeaDTO";

export class GetIdeaByIdUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly userRepository: IUserRepository,
    private readonly gateReviewRepository: IGateReviewRepository,
  ) {}

  async execute(id: string, requester: RequesterDTO): Promise<IdeaOutputDTO> {
    const idea = await this.ideaRepository.findById(id);

    if (!idea) {
      throw new Error("Ideia não encontrada");
    }

    // Autor, Gestor e avaliadores designados; ideias no Mural (Lançamento) são públicas
    if (idea.currentStage !== "LANCAMENTO") {
      const reviews = await this.gateReviewRepository.findByIdea(idea.id!);
      if (!canViewIdeaHistory(idea, reviews, requester)) {
        throw new Error("You cannot view this idea");
      }
    }

    const cancellerId = idea.cancellation?.byId;
    const users = await this.userRepository.findByIds(cancellerId ? [idea.authorId, cancellerId] : [idea.authorId]);
    const nameById = new Map(users.map((u) => [u.id, u.name]));

    return toIdeaOutputDTO(
      idea,
      nameById.get(idea.authorId) ?? "Colaborador",
      cancellerId ? nameById.get(cancellerId) : undefined,
    );
  }
}
