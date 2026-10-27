import { GateDecisionType } from "../entities/GateDecision";
import { GateReview, GateReviewStatus } from "../entities/GateReview";

export interface IGateReviewRepository {
  create(data: {
    ideaId: string;
    gateId: string;
    round: number;
    requestedById: string;
  }): Promise<GateReview>;
  findById(id: string): Promise<GateReview | null>;
  /** Rodadas da ideia, da mais antiga para a mais recente */
  findByIdea(ideaId: string): Promise<GateReview[]>;
  /** Maior número de rodada da ideia nesse gate (0 se nunca passou por ele) */
  lastRound(ideaId: string, gateId: string): Promise<number>;
  findByStatus(status: GateReviewStatus): Promise<GateReview[]>;
  /** Todas as rodadas, em ordem de abertura (funil) */
  findAll(): Promise<GateReview[]>;
  findAssignedTo(evaluatorId: string, status: GateReviewStatus): Promise<GateReview[]>;
  assignEvaluators(
    reviewId: string,
    evaluatorIds: string[],
    assignedById: string,
    deadlineAt: Date,
  ): Promise<GateReview>;
  markReadyForDecision(
    reviewId: string,
    consolidatedScore: number,
    recommendation: GateDecisionType,
  ): Promise<GateReview>;
  markDecided(reviewId: string): Promise<GateReview>;
}
