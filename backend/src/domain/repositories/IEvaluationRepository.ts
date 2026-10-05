import { Evaluation } from "../entities/Evaluation";

export interface IEvaluationRepository {
  create(evaluation: Evaluation): Promise<Evaluation>;
}
