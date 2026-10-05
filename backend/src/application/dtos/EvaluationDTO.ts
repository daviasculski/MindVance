export interface SubmitEvaluationInputDTO {
  ideaId: string;
  evaluatorId: string;
  score: number;
  justification: string;
}

export interface EvaluationOutputDTO extends SubmitEvaluationInputDTO {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
