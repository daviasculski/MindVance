import { IEvaluationRepository } from "../../domain/repositories/IEvaluationRepository";
import { IGateRepository } from "../../domain/repositories/IGateRepository";
import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import {
  EvaluationQueueInputDTO,
  EvaluationQueueOutputDTO,
  PendingEvaluationDTO,
} from "../dtos/EvaluationDTO";

export class GetEvaluationQueueUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly userRepository: IUserRepository,
    private readonly gateRepository: IGateRepository,
    private readonly gateReviewRepository: IGateReviewRepository,
  ) {}

  async execute(input: EvaluationQueueInputDTO): Promise<EvaluationQueueOutputDTO> {
    if (input.requesterRole !== "EVALUATOR") {
      throw new Error("Only users with the Evaluator role have an evaluation queue");
    }

    const [assigned, myEvaluations, gates] = await Promise.all([
      this.gateReviewRepository.findAssignedTo(input.requesterId, "EM_AVALIACAO"),
      this.evaluationRepository.findByEvaluatorId(input.requesterId),
      this.gateRepository.findAll(),
    ]);
    const gateById = new Map(gates.map((g) => [g.id, g]));
    const evaluatedReviewIds = new Set(myEvaluations.map((e) => e.reviewId).filter(Boolean));

    // Pendente: rodada em avaliação em que ele foi designado e ainda não enviou parecer
    const pendingReviews = assigned.filter((r) => !evaluatedReviewIds.has(r.id));

    const pending: PendingEvaluationDTO[] = [];
    for (const review of pendingReviews) {
      const idea = await this.ideaRepository.findById(review.ideaId);
      const gate = gateById.get(review.gateId);
      if (!idea || !gate) continue;
      const [author] = await this.userRepository.findByIds([idea.authorId]);
      pending.push({
        reviewId: review.id,
        ideaId: idea.id!,
        title: idea.title,
        description: idea.description,
        authorName: author?.name ?? "Colaborador",
        extraFields: idea.extraFields ?? null,
        currentStage: idea.currentStage,
        createdAt: idea.createdAt!,
        gate: {
          orderIndex: gate.orderIndex,
          name: gate.name,
          approveThreshold: gate.approveThreshold,
          reviseThreshold: gate.reviseThreshold,
          criteria: gate.criteria,
        },
        round: review.round,
        deadlineAt: review.deadlineAt,
        // UC02 FA02: o prazo vencido é sinalizado, mas a avaliação continua aberta
        overdue: review.deadlineAt !== null && review.deadlineAt.getTime() < Date.now(),
      });
    }

    // Concluídas: os pareceres que ele já enviou, do mais recente para o mais antigo
    const completed = [];
    for (const evaluation of myEvaluations) {
      const idea = await this.ideaRepository.findById(evaluation.ideaId);
      const review = evaluation.reviewId
        ? await this.gateReviewRepository.findById(evaluation.reviewId)
        : null;
      completed.push({
        id: evaluation.id!,
        ideaId: evaluation.ideaId,
        ideaTitle: idea?.title ?? "Ideia",
        stage: evaluation.stage,
        round: review?.round ?? null,
        score: evaluation.score,
        createdAt: evaluation.createdAt!,
      });
    }

    return { pending, completed };
  }
}
