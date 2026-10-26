import { IGateDecisionRepository } from "../../domain/repositories/IGateDecisionRepository";
import { IGateRepository } from "../../domain/repositories/IGateRepository";
import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { canViewIdeaHistory } from "../policies/ideaHistoryAccess";
import {
  GateDecisionOutputDTO,
  ListGateDecisionsInputDTO,
} from "../dtos/GateDecisionDTO";

export class ListGateDecisionsUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly gateDecisionRepository: IGateDecisionRepository,
    private readonly userRepository: IUserRepository,
    private readonly gateRepository: IGateRepository,
    private readonly gateReviewRepository: IGateReviewRepository,
  ) {}

  async execute(input: ListGateDecisionsInputDTO): Promise<GateDecisionOutputDTO[]> {
    const idea = await this.ideaRepository.findById(input.ideaId);

    if (!idea) {
      throw new Error("Idea not found");
    }

    const reviews = await this.gateReviewRepository.findByIdea(idea.id!);
    if (!canViewIdeaHistory(idea, reviews, { id: input.requesterId, role: input.requesterRole })) {
      throw new Error("Only the idea author can view its gate decisions");
    }

    const [decisions, gates] = await Promise.all([
      this.gateDecisionRepository.findByIdeaId(input.ideaId),
      this.gateRepository.findAll(),
    ]);

    const deciderIds = [...new Set(decisions.map((d) => d.deciderId))];
    const deciders = await this.userRepository.findByIds(deciderIds);
    const nameById = new Map(deciders.map((u) => [u.id, u.name]));
    const reviewById = new Map(reviews.map((r) => [r.id, r]));
    const gateOrderById = new Map(gates.map((g) => [g.id, g.orderIndex]));

    return decisions.map((d) => {
      const review = d.reviewId ? reviewById.get(d.reviewId) : undefined;
      return {
        id: d.id!,
        ideaId: d.ideaId,
        stage: d.stage,
        toStage: d.toStage,
        decision: d.decision,
        recommendation: d.recommendation,
        consolidatedScore: d.consolidatedScore,
        round: review?.round ?? null,
        gateOrder: review ? gateOrderById.get(review.gateId) ?? null : null,
        feedback: d.feedback,
        reviewPoints: d.reviewPoints,
        deciderId: d.deciderId,
        deciderName: nameById.get(d.deciderId) ?? "Gestor de Inovação",
        createdAt: d.createdAt!,
      };
    });
  }
}
