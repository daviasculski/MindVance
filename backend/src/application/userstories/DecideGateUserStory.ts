import { GateDecision, isGateDecisionType } from "../../domain/entities/GateDecision";
import { IGateDecisionRepository } from "../../domain/repositories/IGateDecisionRepository";
import { IGateRepository } from "../../domain/repositories/IGateRepository";
import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { DecideGateInputDTO, DecideGateOutputDTO } from "../dtos/GateDecisionDTO";
import { toIdeaOutputDTO } from "../dtos/IdeaDTO";

/**
 * Decisão do Gestor sobre a rodada (D4, D5, D7). A recomendação do sistema é só
 * sugestão: o Gestor pode decidir diferente, e a transição registra as duas.
 */
export class DecideGateUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly gateRepository: IGateRepository,
    private readonly gateReviewRepository: IGateReviewRepository,
    private readonly gateDecisionRepository: IGateDecisionRepository,
  ) {}

  async execute(input: DecideGateInputDTO): Promise<DecideGateOutputDTO> {
    if (input.deciderRole !== "GATEKEEPER") {
      throw new Error("Only gatekeepers can decide gates");
    }

    if (!isGateDecisionType(input.decision)) {
      throw new Error("Decision must be APROVADA, REJEITADA or REVISAO");
    }

    const feedback = typeof input.feedback === "string" ? input.feedback.trim() : "";
    if (feedback.length === 0) {
      throw new Error("Feedback is required to decide a gate");
    }

    let reviewPoints: string[] | null = null;
    if (input.decision === "REVISAO" && input.reviewPoints !== undefined) {
      if (
        !Array.isArray(input.reviewPoints) ||
        !input.reviewPoints.every((p) => typeof p === "string")
      ) {
        throw new Error("Review points must be a list of texts");
      }
      const points = (input.reviewPoints as string[]).map((p) => p.trim()).filter(Boolean);
      reviewPoints = points.length > 0 ? points : null;
    }

    const review = await this.gateReviewRepository.findById(input.reviewId);
    if (!review) {
      throw new Error("Gate review not found");
    }
    // Só decide depois de todos os pareceres da rodada (US019)
    if (review.status !== "AGUARDANDO_DECISAO") {
      throw new Error("Gate review is not awaiting a decision");
    }

    const idea = await this.ideaRepository.findById(review.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    const gate = await this.gateRepository.findById(review.gateId);
    if (!gate) {
      throw new Error("Gate not found");
    }

    // Aprovar leva ao estágio seguinte. Se ele não tem gate de saída (Lançamento),
    // o ciclo de gates termina com a ideia aprovada para lançamento (P2).
    let progress;
    if (input.decision === "APROVADA") {
      const nextGate = await this.gateRepository.findByFromStage(gate.toStage);
      progress = {
        currentStage: gate.toStage,
        status: nextGate ? ("EM_ANDAMENTO" as const) : ("APROVADA" as const),
      };
    } else {
      progress = {
        status: input.decision === "REJEITADA" ? ("REJEITADA" as const) : ("EM_REVISAO" as const),
      };
    }

    const decision = await this.gateDecisionRepository.create(
      new GateDecision({
        ideaId: idea.id!,
        reviewId: review.id,
        stage: gate.fromStage,
        toStage: input.decision === "APROVADA" ? gate.toStage : null,
        decision: input.decision,
        recommendation: review.recommendation,
        consolidatedScore: review.consolidatedScore,
        feedback,
        reviewPoints,
        deciderId: input.deciderId,
      }),
    );
    await this.gateReviewRepository.markDecided(review.id);
    const updatedIdea = await this.ideaRepository.updateProgress(idea.id!, progress);

    return {
      decision: {
        id: decision.id!,
        ideaId: decision.ideaId,
        stage: decision.stage,
        toStage: decision.toStage,
        decision: decision.decision,
        recommendation: decision.recommendation,
        consolidatedScore: decision.consolidatedScore,
        round: review.round,
        gateOrder: gate.orderIndex,
        feedback: decision.feedback,
        reviewPoints: decision.reviewPoints,
        deciderId: decision.deciderId,
        createdAt: decision.createdAt!,
      },
      idea: toIdeaOutputDTO(updatedIdea),
    };
  }
}
