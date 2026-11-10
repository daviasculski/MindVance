import { GateDecision } from "../../domain/entities/GateDecision";
import { GateReview } from "../../domain/entities/GateReview";
import { Idea } from "../../domain/entities/Idea";
import { IdeaStage, ideaStages } from "../../domain/entities/IdeaStage";
import { ManualStageTransition } from "../../domain/entities/ManualStageTransition";

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
export function stageJourney(
  idea: Idea,
  decisions: GateDecision[],
  manualTransitions: ManualStageTransition[] = [],
): StageStay[] {
  const ownDecisions = decisions
    .filter((d) => d.ideaId === idea.id)
    .map((decision) => ({ kind: "decision" as const, date: decision.createdAt!, decision }));
  const ownManualTransitions = manualTransitions
    .filter((transition) => transition.ideaId === idea.id)
    .map((transition) => ({ kind: "manual" as const, date: transition.createdAt!, transition }));
  const own = [...ownDecisions, ...ownManualTransitions].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const stays: StageStay[] = [{ stage: "IDEACAO", enteredAt: idea.createdAt!, leftAt: null }];
  for (const event of own) {
    const current = stays[stays.length - 1];
    if (event.kind === "manual") {
      current.leftAt = event.date;
      stays.push({ stage: event.transition.toStage, enteredAt: event.date, leftAt: null });
    } else if (event.decision.decision === "APROVADA" && event.decision.toStage) {
      current.leftAt = event.date;
      stays.push({ stage: event.decision.toStage, enteredAt: event.date, leftAt: null });
    } else if (event.decision.decision === "REJEITADA") {
      current.leftAt = event.date;
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
export function lastMovementAt(
  idea: Idea,
  decisions: GateDecision[],
  reviews: GateReview[],
  manualTransitions: ManualStageTransition[] = [],
): Date {
  const dates = [
    idea.createdAt!,
    ...decisions.filter((d) => d.ideaId === idea.id).map((d) => d.createdAt!),
    ...reviews.filter((r) => r.ideaId === idea.id).map((r) => r.openedAt),
    ...manualTransitions
      .filter((transition) => transition.ideaId === idea.id)
      .map((transition) => transition.createdAt!),
  ];
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}
