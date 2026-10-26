import { IEvaluationRepository } from "../../domain/repositories/IEvaluationRepository";
import { IGateRepository } from "../../domain/repositories/IGateRepository";
import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { canViewIdeaHistory } from "../policies/ideaHistoryAccess";
import {
  IdeaEvaluationOutputDTO,
  ListIdeaEvaluationsInputDTO,
} from "../dtos/EvaluationDTO";

export class ListIdeaEvaluationsUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly userRepository: IUserRepository,
    private readonly gateRepository: IGateRepository,
    private readonly gateReviewRepository: IGateReviewRepository,
  ) {}

  async execute(input: ListIdeaEvaluationsInputDTO): Promise<IdeaEvaluationOutputDTO[]> {
    const idea = await this.ideaRepository.findById(input.ideaId);

    if (!idea) {
      throw new Error("Idea not found");
    }

    const reviews = await this.gateReviewRepository.findByIdea(idea.id!);
    if (!canViewIdeaHistory(idea, reviews, { id: input.requesterId, role: input.requesterRole })) {
      throw new Error("Only the idea author can view its evaluations");
    }

    const [evaluations, gates] = await Promise.all([
      this.evaluationRepository.findByIdeaId(input.ideaId),
      this.gateRepository.findAll(),
    ]);

    const evaluatorIds = [...new Set(evaluations.map((e) => e.evaluatorId))];
    const evaluators = await this.userRepository.findByIds(evaluatorIds);
    const nameById = new Map(evaluators.map((u) => [u.id, u.name]));
    const reviewById = new Map(reviews.map((r) => [r.id, r]));
    const gateOrderById = new Map(gates.map((g) => [g.id, g.orderIndex]));

    // Ordem cronológica, da avaliação mais antiga para a mais recente
    return evaluations
      .map((evaluation) => {
        const review = evaluation.reviewId ? reviewById.get(evaluation.reviewId) : undefined;
        return {
          id: evaluation.id!,
          evaluatorId: evaluation.evaluatorId,
          evaluatorName: nameById.get(evaluation.evaluatorId) ?? "Avaliador",
          score: evaluation.score,
          justification: evaluation.justification,
          stage: evaluation.stage,
          round: review?.round ?? null,
          gateOrder: review ? gateOrderById.get(review.gateId) ?? null : null,
          criteria: evaluation.criteria,
          createdAt: evaluation.createdAt!,
        };
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
