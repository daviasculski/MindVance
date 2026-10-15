import {
  Evaluation,
  EvaluationCriterion,
} from "../../domain/entities/Evaluation";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IEvaluationRepository } from "../../domain/repositories/IEvaluationRepository";
import {
  EvaluationOutputDTO,
  SubmitEvaluationInputDTO,
} from "../dtos/EvaluationDTO";

export const MIN_SCORE = 0;
export const MAX_SCORE = 10;

function isValidScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= MIN_SCORE &&
    value <= MAX_SCORE
  );
}

function parseCriteria(value: unknown): EvaluationCriterion[] | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Array.isArray(value)) {
    throw new Error("Evaluation criteria must be a list");
  }

  return value.map((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof item.name !== "string" ||
      item.name.trim().length === 0 ||
      typeof item.weight !== "number" ||
      !Number.isFinite(item.weight) ||
      !isValidScore(item.score) ||
      (item.comment !== undefined && typeof item.comment !== "string")
    ) {
      throw new Error(
        `Each criterion requires a name, a weight and a score between ${MIN_SCORE} and ${MAX_SCORE}`,
      );
    }

    return {
      name: item.name.trim(),
      weight: item.weight,
      score: item.score,
      ...(item.comment?.trim() ? { comment: item.comment.trim() } : {}),
    };
  });
}

export class SubmitEvaluationUserStory {
  constructor(
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly ideaRepository: IIdeaRepository,
  ) {}

  async execute(
    input: SubmitEvaluationInputDTO,
  ): Promise<EvaluationOutputDTO> {
    if (input.evaluatorRole !== "EVALUATOR") {
      throw new Error(
        "Only users with the Evaluator role can submit evaluations",
      );
    }

    const idea = await this.ideaRepository.findById(input.ideaId);

    if (!idea) {
      throw new Error("Idea not found");
    }

    if (input.evaluatorId === idea.authorId) {
      throw new Error("Authors cannot evaluate their own ideas");
    }

    if (!isValidScore(input.score)) {
      throw new Error(
        `Evaluation score must be a number between ${MIN_SCORE} and ${MAX_SCORE}`,
      );
    }

    if (!input.justification || input.justification.trim().length === 0) {
      throw new Error("Evaluation justification is required");
    }

    const criteria = parseCriteria(input.criteria);

    // Um avaliador avalia cada ideia uma única vez por estágio
    const existing = await this.evaluationRepository.findByIdeaId(idea.id!);
    const alreadyEvaluated = existing.some(
      (e) =>
        e.evaluatorId === input.evaluatorId && e.stage === idea.currentStage,
    );

    if (alreadyEvaluated) {
      throw new Error("Idea already evaluated by this evaluator in this stage");
    }

    const evaluation = new Evaluation({
      ideaId: input.ideaId,
      evaluatorId: input.evaluatorId,
      score: input.score,
      justification: input.justification,
      stage: idea.currentStage,
      criteria,
    });

    const savedEvaluation = await this.evaluationRepository.create(evaluation);

    return {
      id: savedEvaluation.id!,
      ideaId: savedEvaluation.ideaId,
      evaluatorId: savedEvaluation.evaluatorId,
      score: savedEvaluation.score,
      justification: savedEvaluation.justification,
      stage: savedEvaluation.stage,
      criteria: savedEvaluation.criteria,
      createdAt: savedEvaluation.createdAt!,
      updatedAt: savedEvaluation.updatedAt!,
    };
  }
}
