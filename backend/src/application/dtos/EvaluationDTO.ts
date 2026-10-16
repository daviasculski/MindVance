import { UserRole } from "../../domain/entities/UserRole";

export interface SubmitEvaluationInputDTO {
  ideaId: string;
  evaluatorId: string;
  evaluatorRole: UserRole | undefined;
  score: number;
  justification: string;
}

export interface EvaluationOutputDTO
  extends Omit<SubmitEvaluationInputDTO, "evaluatorRole"> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
