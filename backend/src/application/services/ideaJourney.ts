import { GateDecision } from "../../domain/entities/GateDecision";
import { GateReview } from "../../domain/entities/GateReview";
import { Idea } from "../../domain/entities/Idea";
import { IdeaStage, ideaStages } from "../../domain/entities/IdeaStage";

export interface StageStay {
  stage: IdeaStage;
  enteredAt: Date;
  /** null enquanto a ideia continua no estágio */
  leftAt: Date | null;
}

/**
 * Trajetória da ideia pelos estágios, a partir das transições (gate_decisions):
 * entra em Ideação na submissão e em cada estágio seguinte quando um gate é aprovado.
 * Uma rejeição encerra a permanência no estágio em que ocorreu.
 */
export function stageJourney(idea: Idea, decisions: GateDecision[]): StageStay[] {
  const own = decisions
    .filter((d) => d.ideaId === idea.id)
    .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());

  const stays: StageStay[] = [{ stage: "IDEACAO", enteredAt: idea.createdAt!, leftAt: null }];
  for (const d of own) {
    const current = stays[stays.length - 1];
    if (d.decision === "APROVADA" && d.toStage) {
      current.leftAt = d.createdAt!;
      stays.push({ stage: d.toStage, enteredAt: d.createdAt!, leftAt: null });
    } else if (d.decision === "REJEITADA") {
      current.leftAt = d.createdAt!;
    }
  }
  return stays;
}

/** Índice do estágio mais avançado que a ideia alcançou (para a contagem de sobrevivência do funil). */
export function furthestStageIndex(idea: Idea): number {
  return ideaStages.indexOf(idea.currentStage);
}

/**
 * Última movimentação da ideia: submissão, abertura de rodada ou decisão de gate.
 * É a partir dela que o "Gate Aging" conta os dias parados (FUN-05).
 */
export function lastMovementAt(idea: Idea, decisions: GateDecision[], reviews: GateReview[]): Date {
  const dates = [
    idea.createdAt!,
    ...decisions.filter((d) => d.ideaId === idea.id).map((d) => d.createdAt!),
    ...reviews.filter((r) => r.ideaId === idea.id).map((r) => r.openedAt),
  ];
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}
