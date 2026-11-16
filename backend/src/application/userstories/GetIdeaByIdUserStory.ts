import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { canViewIdeaDetails, canViewIdeaHistory } from "../policies/ideaHistoryAccess";
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

    // Autor, Gestor, Admin e avaliadores designados; ideias no Mural são públicas.
    if (idea.currentStage !== "LANCAMENTO") {
      const reviews = await this.gateReviewRepository.findByIdea(idea.id!);
      if (!canViewIdeaDetails(idea, reviews, requester)) {
        throw new Error("You cannot view this idea");
      }
    }

    const cancellerId = idea.cancellation?.byId;
    const users = await this.userRepository.findByIds(cancellerId ? [idea.authorId, cancellerId] : [idea.authorId]);
    const nameById = new Map(users.map((u) => [u.id, u.name]));

    const output = toIdeaOutputDTO(
      idea,
      nameById.get(idea.authorId) ?? "Colaborador",
      cancellerId ? nameById.get(cancellerId) : undefined,
    );
    if (!canViewIdeaHistory(idea, requester)) output.cancellation = null;
    return output;
  }
}
