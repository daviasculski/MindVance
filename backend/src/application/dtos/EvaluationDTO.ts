import { EvaluationCriterion } from "../../domain/entities/Evaluation";
import { IdeaStage } from "../../domain/entities/IdeaStage";
import { UserRole } from "../../domain/entities/UserRole";

export interface SubmitEvaluationInputDTO {
  ideaId: string;
  evaluatorId: string;
  evaluatorRole: UserRole | undefined;
  score: number;
  justification: string;
  criteria?: EvaluationCriterion[];
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
  criteria: EvaluationCriterion[] | null;
  createdAt: Date;
}

export interface EvaluationOutputDTO
  extends Omit<SubmitEvaluationInputDTO, "evaluatorRole" | "criteria"> {
  id: string;
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
  ideaId: string;
  title: string;
  description: string;
  authorName: string;
  extraFields: Record<string, unknown> | null;
  currentStage: IdeaStage;
  createdAt: Date;
}

export interface CompletedEvaluationDTO {
  id: string;
  ideaId: string;
  ideaTitle: string;
  stage: IdeaStage;
  score: number;
  createdAt: Date;
}

export interface EvaluationQueueOutputDTO {
  pending: PendingEvaluationDTO[];
  completed: CompletedEvaluationDTO[];
}
