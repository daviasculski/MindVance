import { EvaluationCriterion } from "../../domain/entities/Evaluation";
import { GateCriterion } from "../../domain/entities/Gate";
import { IdeaStage } from "../../domain/entities/IdeaStage";
import { UserRole } from "../../domain/entities/UserRole";

export interface SubmitEvaluationInputDTO {
  reviewId: unknown;
  evaluatorId: string;
  evaluatorRole: UserRole | undefined;
  justification: string;
  /** [{ criterionId, score, comment? }] — um item por critério do gate */
  criteria: unknown;
}

export interface ListIdeaEvaluationsInputDTO {
  ideaId: string;
  requesterId: string;
  requesterRole: UserRole | undefined;
}

export interface IdeaEvaluationOutputDTO {
  id: string;
  evaluatorId: string;
  evaluatorName: string;
  score: number;
  justification: string;
  stage: IdeaStage;
  /** Rodada e gate da avaliação (null em avaliações anteriores ao modelo de rodadas) */
  round: number | null;
  gateOrder: number | null;
  criteria: EvaluationCriterion[] | null;
  createdAt: Date;
}

export interface EvaluationOutputDTO {
  id: string;
  ideaId: string;
  evaluatorId: string;
  reviewId: string;
  score: number;
  justification: string;
  stage: IdeaStage;
  criteria: EvaluationCriterion[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvaluationQueueInputDTO {
  requesterId: string;
  requesterRole: UserRole | undefined;
}

export interface PendingEvaluationDTO {
  reviewId: string;
  ideaId: string;
  title: string;
  description: string;
  authorName: string;
  extraFields: Record<string, unknown> | null;
  currentStage: IdeaStage;
  createdAt: Date;
  gate: {
    orderIndex: number;
    name: string;
    approveThreshold: number;
    reviseThreshold: number;
    criteria: GateCriterion[];
  };
  round: number;
  deadlineAt: Date | null;
  overdue: boolean;
}

export interface CompletedEvaluationDTO {
  id: string;
  ideaId: string;
  ideaTitle: string;
  stage: IdeaStage;
  round: number | null;
  score: number;
  createdAt: Date;
}

export interface EvaluationQueueOutputDTO {
  pending: PendingEvaluationDTO[];
  completed: CompletedEvaluationDTO[];
}
