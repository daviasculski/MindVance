import { IGateRepository } from "../../domain/repositories/IGateRepository";
import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { RequesterDTO } from "../dtos/IdeaDTO";
import { Notifier } from "../services/Notifier";

const DAY_MS = 24 * 60 * 60 * 1000;

/** O Gestor designa os avaliadores da rodada (D3); o autor da ideia nunca pode ser designado (GAT-04). */
export class AssignEvaluatorsUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly gateRepository: IGateRepository,
    private readonly gateReviewRepository: IGateReviewRepository,
    private readonly userRepository: IUserRepository,
    private readonly notifier?: Notifier,
  ) {}

  async execute(reviewId: string, evaluatorIds: unknown, requester: RequesterDTO) {
    if (requester.role !== "GATEKEEPER") {
      throw new Error("Only the gatekeeper designates evaluators");
    }

    if (
      !Array.isArray(evaluatorIds) ||
      evaluatorIds.length === 0 ||
      !evaluatorIds.every((id) => typeof id === "string" && id.length > 0)
    ) {
      throw new Error("Select at least one evaluator");
    }
    const ids = [...new Set(evaluatorIds as string[])];

    const review = await this.gateReviewRepository.findById(reviewId);
    if (!review) {
      throw new Error("Gate review not found");
    }
    if (review.status !== "AGUARDANDO_DESIGNACAO") {
      throw new Error("Evaluators were already designated for this round");
    }

    const idea = await this.ideaRepository.findById(review.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    if (ids.includes(idea.authorId)) {
      throw new Error("The idea author cannot be designated as evaluator");
    }

    const users = await this.userRepository.findByIds(ids);
    const allEvaluators =
      users.length === ids.length &&
      users.every((u) => u.role === "EVALUATOR" && u.approvalStatus === "APPROVED");
    if (!allEvaluators) {
      throw new Error("Only approved evaluators can be designated");
    }

    const gate = await this.gateRepository.findById(review.gateId);
    if (!gate) {
      throw new Error("Gate not found");
    }

    const deadlineAt = new Date(Date.now() + gate.deadlineDays * DAY_MS);
    const updated = await this.gateReviewRepository.assignEvaluators(
      review.id,
      ids,
      requester.id,
      deadlineAt,
    );
    await this.ideaRepository.updateProgress(idea.id!, { status: "EM_AVALIACAO" });
    await this.notifier?.evaluatorsAssigned(idea, gate, review.round, ids, deadlineAt);

    return {
      reviewId: updated.id,
      status: updated.status,
      deadlineAt: updated.deadlineAt,
      evaluatorIds: updated.evaluators.map((e) => e.evaluatorId),
    };
  }
}
