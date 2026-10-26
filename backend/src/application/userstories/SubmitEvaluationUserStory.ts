import { Evaluation, EvaluationCriterion } from "../../domain/entities/Evaluation";
import {
  CriterionScore,
  Gate,
  consolidatedScore,
  recommendation,
  weightedScore,
} from "../../domain/entities/Gate";
import { IEvaluationRepository } from "../../domain/repositories/IEvaluationRepository";
import { IGateRepository } from "../../domain/repositories/IGateRepository";
import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { EvaluationOutputDTO, SubmitEvaluationInputDTO } from "../dtos/EvaluationDTO";

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

/** UC02 FA01: todos os critérios do gate, cada um com nota de 0 a 10. */
function parseCriteria(gate: Gate, value: unknown): EvaluationCriterion[] {
  if (!Array.isArray(value)) {
    throw new Error("Every criterion of the gate must be scored");
  }

  return gate.criteria.map((criterion) => {
    const item = value.find(
      (v: unknown) =>
        typeof v === "object" && v !== null && (v as { criterionId?: unknown }).criterionId === criterion.id,
    ) as { score?: unknown; comment?: unknown } | undefined;

    if (!item) {
      throw new Error("Every criterion of the gate must be scored");
    }
    if (!isValidScore(item.score)) {
      throw new Error(`Evaluation score must be a number between ${MIN_SCORE} and ${MAX_SCORE}`);
    }
    if (item.comment !== undefined && typeof item.comment !== "string") {
      throw new Error("Criterion comment must be a text");
    }

    const comment = typeof item.comment === "string" ? item.comment.trim() : "";
    // Nome e peso copiados do gate: mudar a configuração depois não altera o parecer (ADM-04)
    return {
      criterionId: criterion.id,
      name: criterion.name,
      weight: criterion.weight,
      score: item.score,
      ...(comment ? { comment } : {}),
    };
  });
}

export class SubmitEvaluationUserStory {
  constructor(
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly ideaRepository: IIdeaRepository,
    private readonly gateRepository: IGateRepository,
    private readonly gateReviewRepository: IGateReviewRepository,
  ) {}

  async execute(input: SubmitEvaluationInputDTO): Promise<EvaluationOutputDTO> {
    if (input.evaluatorRole !== "EVALUATOR") {
      throw new Error("Only users with the Evaluator role can submit evaluations");
    }

    const review =
      typeof input.reviewId === "string"
        ? await this.gateReviewRepository.findById(input.reviewId)
        : null;
    if (!review) {
      throw new Error("Gate review not found");
    }

    // Só avalia quem foi designado para esta rodada (GAT-09)
    if (!review.evaluators.some((e) => e.evaluatorId === input.evaluatorId)) {
      throw new Error("Only designated evaluators can evaluate this round");
    }
    if (review.status !== "EM_AVALIACAO") {
      throw new Error("This round is not open for evaluation");
    }

    const idea = await this.ideaRepository.findById(review.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    if (input.evaluatorId === idea.authorId) {
      throw new Error("Authors cannot evaluate their own ideas");
    }

    const gate = await this.gateRepository.findById(review.gateId);
    if (!gate) {
      throw new Error("Gate not found");
    }

    if (!input.justification || input.justification.trim().length === 0) {
      throw new Error("Evaluation justification is required");
    }

    const criteria = parseCriteria(gate, input.criteria);

    const roundEvaluations = await this.evaluationRepository.findByReviewId(review.id);
    if (roundEvaluations.some((e) => e.evaluatorId === input.evaluatorId)) {
      throw new Error("Idea already evaluated by this evaluator in this round");
    }

    const scores: CriterionScore[] = criteria.map((c) => ({
      criterionId: c.criterionId!,
      score: c.score,
    }));

    const saved = await this.evaluationRepository.create(
      new Evaluation({
        ideaId: idea.id!,
        evaluatorId: input.evaluatorId,
        score: weightedScore(gate, scores),
        justification: input.justification.trim(),
        stage: gate.fromStage,
        reviewId: review.id,
        criteria,
      }),
    );

    // Quando todos os designados concluem: consolida, recomenda e libera a decisão (US019)
    const all = [...roundEvaluations, saved];
    const everyoneDone = review.evaluators.every((d) =>
      all.some((e) => e.evaluatorId === d.evaluatorId),
    );
    if (everyoneDone) {
      const score = consolidatedScore(
        gate,
        all.map((e) =>
          (e.criteria ?? []).map((c) => ({ criterionId: c.criterionId ?? "", score: c.score })),
        ),
      );
      await this.gateReviewRepository.markReadyForDecision(
        review.id,
        score,
        recommendation(gate, score),
      );
      await this.ideaRepository.updateProgress(idea.id!, { status: "AGUARDANDO_DECISAO" });
    }

    return {
      id: saved.id!,
      ideaId: saved.ideaId,
      evaluatorId: saved.evaluatorId,
      reviewId: review.id,
      score: saved.score,
      justification: saved.justification,
      stage: saved.stage,
      criteria: saved.criteria,
      createdAt: saved.createdAt!,
      updatedAt: saved.updatedAt!,
    };
  }
}
