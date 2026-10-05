import { Evaluation } from "../../domain/entities/Evaluation";
import { IEvaluationRepository } from "../../domain/repositories/IEvaluationRepository";
import {
  EvaluationOutputDTO,
  SubmitEvaluationInputDTO,
} from "../dtos/EvaluationDTO";

export class SubmitEvaluationUserStory {
  constructor(
    private readonly evaluationRepository: IEvaluationRepository,
  ) {}

  async execute(
    input: SubmitEvaluationInputDTO,
  ): Promise<EvaluationOutputDTO> {
    if (!input.justification || input.justification.trim().length === 0) {
      throw new Error("Evaluation justification is required");
    }

    const evaluation = new Evaluation({
      ideaId: input.ideaId,
      evaluatorId: input.evaluatorId,
      score: input.score,
      justification: input.justification,
    });

    const savedEvaluation = await this.evaluationRepository.create(evaluation);

    return {
      id: savedEvaluation.id!,
      ideaId: savedEvaluation.ideaId,
      evaluatorId: savedEvaluation.evaluatorId,
      score: savedEvaluation.score,
      justification: savedEvaluation.justification,
      createdAt: savedEvaluation.createdAt!,
      updatedAt: savedEvaluation.updatedAt!,
    };
  }
}
