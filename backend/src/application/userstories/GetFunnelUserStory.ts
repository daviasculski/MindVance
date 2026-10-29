import { IdeaStage, ideaStages } from "../../domain/entities/IdeaStage";
import { IGateDecisionRepository } from "../../domain/repositories/IGateDecisionRepository";
import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IdeaOutputDTO, toIdeaOutputDTO } from "../dtos/IdeaDTO";
import { furthestStageIndex, lastMovementAt } from "../services/ideaJourney";

export interface FunnelIdeaDTO extends IdeaOutputDTO {
  /** Última submissão, abertura de rodada ou decisão: base do Gate Aging (FUN-05) */
  lastMovementAt: Date;
  /** Rodada mais recente no gate atual (null antes da triagem) */
  currentRound: number | null;
  /** Justificativa da rejeição, preservada para o card (FRO-06) */
  rejectionFeedback: string | null;
}

export interface FunnelDTO {
  ideas: FunnelIdeaDTO[];
  /** Quantas ideias chegaram a cada estágio (sobrevivência do funil) */
  reachedByStage: { stage: IdeaStage; count: number }[];
}

/** Painel do funil: todas as ideias por estágio. Só o Gestor de Inovação (FUN-04). */
export class GetFunnelUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly userRepository: IUserRepository,
    private readonly gateReviewRepository: IGateReviewRepository,
    private readonly gateDecisionRepository: IGateDecisionRepository,
  ) {}

  async execute(): Promise<FunnelDTO> {
    const [ideas, reviews, decisions] = await Promise.all([
      this.ideaRepository.findAll(),
      this.gateReviewRepository.findAll(),
      this.gateDecisionRepository.findAll(),
    ]);
    const activeIdeas = ideas.filter((idea) => idea.status !== "CANCELLED");
    const authors = await this.userRepository.findByIds([...new Set(activeIdeas.map((i) => i.authorId))]);
    const nameById = new Map(authors.map((u) => [u.id, u.name]));

    return {
      ideas: activeIdeas.map((idea) => {
        const ideaReviews = reviews.filter((r) => r.ideaId === idea.id);
        const rejection = [...decisions]
          .reverse()
          .find((d) => d.ideaId === idea.id && d.decision === "REJEITADA");
        return {
          ...toIdeaOutputDTO(idea, nameById.get(idea.authorId) ?? "Colaborador"),
          lastMovementAt: lastMovementAt(idea, decisions, reviews),
          currentRound: ideaReviews.length > 0 ? ideaReviews[ideaReviews.length - 1].round : null,
          rejectionFeedback: idea.status === "REJEITADA" ? rejection?.feedback ?? null : null,
        };
      }),
      reachedByStage: ideaStages.map((stage, i) => ({
        stage,
        count: activeIdeas.filter((idea) => furthestStageIndex(idea) >= i).length,
      })),
    };
  }
}
