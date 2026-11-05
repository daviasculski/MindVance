import { IdeaOutputDTO, RequesterDTO, toIdeaOutputDTO } from "../dtos/IdeaDTO";
import { IdeaStatus } from "../../domain/entities/IdeaStatus";
import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { Notifier } from "../services/Notifier";

/** Ideias já encerradas (aprovadas para lançamento, rejeitadas ou canceladas) não podem ser canceladas */
const closedStatuses: IdeaStatus[] = ["APROVADA", "REJEITADA", "CANCELLED"];

/**
 * Cancela uma ideia ativa no funil (autor, Gestor ou Administrador).
 * - CAN-02: encerra a rodada de gate aberta, para a ideia sair das filas e não ser reativada.
 * - CAN-03: registra quem cancelou, quando e a justificativa (obrigatória). Nada é apagado.
 */
export class CancelIdeaUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly gateReviewRepository: IGateReviewRepository,
    private readonly userRepository: IUserRepository,
    private readonly notifier?: Notifier,
  ) {}

  async execute(id: string, reason: unknown, requester: RequesterDTO): Promise<IdeaOutputDTO> {
    const justification = typeof reason === "string" ? reason.trim() : "";
    if (justification.length === 0) {
      throw new Error("Cancellation justification is required");
    }

    const idea = await this.ideaRepository.findById(id);
    if (!idea) {
      throw new Error("Ideia não encontrada");
    }

    const isAuthor = idea.authorId === requester.id;
    const canManage = requester.role === "GATEKEEPER" || requester.role === "ADMIN";
    if (!isAuthor && !canManage) {
      throw new Error("Only the author or a manager can cancel this idea");
    }

    if (closedStatuses.includes(idea.status)) {
      throw new Error("Only active ideas can be cancelled");
    }

    const closedReviews = await this.gateReviewRepository.cancelOpenForIdea(idea.id!);
    const cancelledIdea = await this.ideaRepository.cancel(idea.id!, {
      at: new Date(),
      byId: requester.id,
      reason: justification,
    });

    const [canceller] = await this.userRepository.findByIds([requester.id]);
    const cancellerName = canceller?.name ?? "Usuário";
    const designatedEvaluators = closedReviews.flatMap((r) => r.evaluators.map((e) => e.evaluatorId));
    await this.notifier?.ideaCancelled(cancelledIdea, cancellerName, justification, isAuthor, designatedEvaluators);

    return toIdeaOutputDTO(cancelledIdea, undefined, cancellerName);
  }
}
