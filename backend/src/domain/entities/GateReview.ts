import { GateDecisionType } from "./GateDecision";

export type GateReviewStatus =
  | "AGUARDANDO_DESIGNACAO"
  | "EM_AVALIACAO"
  | "AGUARDANDO_DECISAO"
  | "DECIDIDA";

export interface GateReviewEvaluator {
  evaluatorId: string;
  assignedById: string;
  assignedAt: Date;
}

/** Rodada de avaliação de uma ideia em um gate. Revisar abre uma nova rodada no mesmo gate. */
export interface GateReview {
  id: string;
  ideaId: string;
  gateId: string;
  round: number;
  status: GateReviewStatus;
  requestedById: string;
  openedAt: Date;
  deadlineAt: Date | null;
  consolidatedScore: number | null;
  recommendation: GateDecisionType | null;
  /** Quando o prazo venceu com pareceres faltando (null se não venceu) */
  overdueAt: Date | null;
  evaluators: GateReviewEvaluator[];
}
