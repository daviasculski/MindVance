import { GateDecisionType } from "./GateDecision";
import { IdeaStage } from "./IdeaStage";

export interface GateCriterion {
  id: string;
  name: string;
  description: string;
  /** Peso em pontos percentuais; os pesos de um gate somam 100 */
  weight: number;
  orderIndex: number;
}

/** Gate de saída de um estágio. Vem do banco (configuração do sistema), não da interface. */
export interface Gate {
  id: string;
  orderIndex: number;
  name: string;
  fromStage: IdeaStage;
  toStage: IdeaStage;
  deliverable: string;
  deadlineDays: number;
  approveThreshold: number;
  reviseThreshold: number;
  criteria: GateCriterion[];
}

export interface CriterionScore {
  criterionId: string;
  score: number;
}

/** Score de um parecer: Σ(nota × peso / 100), escala 0–10. */
export function weightedScore(gate: Gate, scores: CriterionScore[]): number {
  const byId = new Map(scores.map((s) => [s.criterionId, s.score]));
  const total = gate.criteria.reduce(
    (acc, c) => acc + ((byId.get(c.id) ?? 0) * c.weight) / 100,
    0,
  );
  return Math.round(total * 100) / 100;
}

/**
 * Score consolidado da rodada: média de cada critério entre os avaliadores,
 * depois Σ(média × peso / 100), escala 0–10.
 */
export function consolidatedScore(gate: Gate, evaluations: CriterionScore[][]): number {
  if (evaluations.length === 0) return 0;
  const averages = gate.criteria.map((c) => {
    const values = evaluations.map(
      (scores) => scores.find((s) => s.criterionId === c.id)?.score ?? 0,
    );
    return { criterionId: c.id, score: values.reduce((a, b) => a + b, 0) / values.length };
  });
  return weightedScore(gate, averages);
}

/** Limites inclusivos: score >= aprovar → aprovar; score >= revisar → revisar; abaixo → rejeitar. */
export function recommendation(gate: Gate, score: number): GateDecisionType {
  if (score >= gate.approveThreshold) return "APROVADA";
  if (score >= gate.reviseThreshold) return "REVISAO";
  return "REJEITADA";
}
