import { IEvaluationRepository } from "../../domain/repositories/IEvaluationRepository";
import { IGateRepository } from "../../domain/repositories/IGateRepository";
import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { Notifier } from "../services/Notifier";

/**
 * UC02 FA02: rodadas em avaliação com prazo vencido e pareceres faltando.
 * Registra o atraso (uma vez por rodada) e alerta os avaliadores atrasados e
 * os Gestores. A avaliação NÃO é cancelada: continua aberta.
 */
export class CheckOverdueReviewsUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly gateRepository: IGateRepository,
    private readonly gateReviewRepository: IGateReviewRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly notifier?: Notifier,
  ) {}

  async execute(now = new Date()): Promise<number> {
    const reviews = await this.gateReviewRepository.findByStatus("EM_AVALIACAO");
    let flagged = 0;

    for (const review of reviews) {
      if (!review.deadlineAt || review.deadlineAt > now || review.overdueAt) continue;

      const evaluations = await this.evaluationRepository.findByReviewId(review.id);
      const pending = review.evaluators
        .map((e) => e.evaluatorId)
        .filter((id) => !evaluations.some((ev) => ev.evaluatorId === id));
      if (pending.length === 0) continue;

      const [idea, gate] = await Promise.all([
        this.ideaRepository.findById(review.ideaId),
        this.gateRepository.findById(review.gateId),
      ]);
      if (!idea || !gate) continue;

      await this.gateReviewRepository.markOverdue(review.id, now);
      await this.notifier?.evaluationOverdue(idea, gate, review.round, pending);
      flagged += 1;
    }

    return flagged;
  }
}
