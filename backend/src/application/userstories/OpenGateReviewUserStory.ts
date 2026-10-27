import { IGateRepository } from "../../domain/repositories/IGateRepository";
import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { RequesterDTO } from "../dtos/IdeaDTO";
import { Notifier } from "../services/Notifier";

export interface OpenGateReviewOutputDTO {
  reviewId: string;
  ideaId: string;
  gateOrder: number;
  round: number;
  status: "AGUARDANDO_DESIGNACAO";
}

/**
 * Abre uma rodada de avaliação no gate de saída do estágio atual da ideia.
 * - G1: aberto pelo Gestor na triagem (D6).
 * - G2 a G5: solicitado pelo autor depois de produzir as entregas (D6).
 * - Depois de Revisar: o autor solicita uma nova rodada no mesmo gate (P4).
 */
export class OpenGateReviewUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly gateRepository: IGateRepository,
    private readonly gateReviewRepository: IGateReviewRepository,
    private readonly notifier?: Notifier,
  ) {}

  async execute(ideaId: string, requester: RequesterDTO): Promise<OpenGateReviewOutputDTO> {
    const idea = await this.ideaRepository.findById(ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }

    // O Lançamento é o estágio final: não tem gate de saída (P2)
    const gate = await this.gateRepository.findByFromStage(idea.currentStage);
    if (!gate) {
      throw new Error("Idea is in the final stage and has no gate to review");
    }

    const fromTriage = idea.status === "AGUARDANDO_TRIAGEM";
    if (fromTriage) {
      if (requester.role !== "GATEKEEPER") {
        throw new Error("Only the gatekeeper opens Gate 1 after triage");
      }
    } else {
      if (idea.authorId !== requester.id) {
        throw new Error("Only the author can request a gate review");
      }
      // G1 é aberto pelo Gestor; o autor só solicita G2–G5 ou o reenvio após Revisar
      const canRequest =
        idea.status === "EM_REVISAO" ||
        (idea.status === "EM_ANDAMENTO" && idea.currentStage !== "IDEACAO");
      if (!canRequest) {
        throw new Error("Idea cannot request a gate review in its current status");
      }
    }

    const round = (await this.gateReviewRepository.lastRound(idea.id!, gate.id)) + 1;
    const review = await this.gateReviewRepository.create({
      ideaId: idea.id!,
      gateId: gate.id,
      round,
      requestedById: requester.id,
    });
    await this.ideaRepository.updateProgress(idea.id!, { status: "AGUARDANDO_DESIGNACAO" });
    // Triagem: avisa o autor. Solicitação do autor: avisa os Gestores (NOT-02, NOT-03)
    if (fromTriage) {
      await this.notifier?.gateOpened(idea, gate);
    } else {
      await this.notifier?.reviewRequested(idea, gate, round);
    }

    return {
      reviewId: review.id,
      ideaId: idea.id!,
      gateOrder: gate.orderIndex,
      round,
      status: "AGUARDANDO_DESIGNACAO",
    };
  }
}
