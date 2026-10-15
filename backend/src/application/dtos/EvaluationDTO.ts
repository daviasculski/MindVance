import { UserRole } from "../../domain/entities/UserRole";

export interface SubmitEvaluationInputDTO {
  ideaId: string;
  evaluatorId: string;
  evaluatorRole: UserRole | undefined;
  score: number;
  justification: string;
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
  createdAt: Date;
}

export interface EvaluationOutputDTO
  extends Omit<SubmitEvaluationInputDTO, "evaluatorRole"> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
