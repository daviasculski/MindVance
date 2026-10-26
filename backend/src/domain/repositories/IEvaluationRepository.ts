import { Evaluation } from "../entities/Evaluation";

export interface IEvaluationRepository {
  create(evaluation: Evaluation): Promise<Evaluation>;
  findByIdeaId(ideaId: string): Promise<Evaluation[]>;
  findByReviewId(reviewId: string): Promise<Evaluation[]>;
  findByEvaluatorId(evaluatorId: string): Promise<Evaluation[]>;
}
