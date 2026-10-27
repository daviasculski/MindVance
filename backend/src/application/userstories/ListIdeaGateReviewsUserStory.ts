import { IGateRepository } from "../../domain/repositories/IGateRepository";
import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { RequesterDTO } from "../dtos/IdeaDTO";
import { canViewIdeaHistory } from "../policies/ideaHistoryAccess";

/** Rodadas de uma ideia para o histórico: abertura do gate e atraso registrado (ACO-02, GAT-11). */
export class ListIdeaGateReviewsUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly gateRepository: IGateRepository,
    private readonly gateReviewRepository: IGateReviewRepository,
  ) {}

  async execute(ideaId: string, requester: RequesterDTO) {
    const idea = await this.ideaRepository.findById(ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    const reviews = await this.gateReviewRepository.findByIdea(idea.id!);
    if (!canViewIdeaHistory(idea, reviews, requester)) {
      throw new Error("Only the idea author can view its gate reviews");
    }
    const gates = await this.gateRepository.findAll();

    return reviews.map((r) => {
      const gate = gates.find((g) => g.id === r.gateId);
      return {
        id: r.id,
        gateOrder: gate?.orderIndex ?? null,
        gateName: gate?.name ?? "Gate",
        stage: gate?.fromStage ?? null,
        round: r.round,
        status: r.status,
        openedAt: r.openedAt,
        deadlineAt: r.deadlineAt,
        overdueAt: r.overdueAt,
      };
    });
  }
}
