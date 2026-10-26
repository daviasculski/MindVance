import type { GateDecisionType, Idea } from "../types";
import { apiRequest } from "./api";
import { decisionFromApi, toIdea, type ApiIdea } from "./ideas";

export interface GateCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  orderIndex: number;
}

/** Limites de recomendação do gate (vêm do backend; hoje 7,0 e 4,0 em todos). */
export interface GateThresholds {
  approveThreshold: number;
  reviseThreshold: number;
}

export interface GateSummary extends GateThresholds {
  id: string;
  orderIndex: number;
  name: string;
  deliverable: string;
  deadlineDays: number;
  /** Aprovar este gate leva ao estágio final e encerra o ciclo de gates */
  leadsToFinalStage: boolean;
}

export type ApiDecision = "APROVADA" | "REVISAO" | "REJEITADA";
export type ReviewStatus = "AGUARDANDO_DESIGNACAO" | "EM_AVALIACAO" | "AGUARDANDO_DECISAO" | "DECIDIDA";

/**
 * Mesma regra do backend (P5), com limites inclusivos:
 * score >= aprovar → aprovar; score >= revisar → revisar; abaixo → rejeitar.
 */
export function recommend(score: number, t: GateThresholds): GateDecisionType {
  if (score >= t.approveThreshold) return "aprovada";
  if (score >= t.reviseThreshold) return "revisão";
  return "rejeitada";
}

/** Σ(nota × peso / 100), escala 0–10, arredondado como no backend. */
export function weightedScore(criteria: { weight: number; score: number }[]): number {
  const total = criteria.reduce((acc, c) => acc + (c.score * c.weight) / 100, 0);
  return Math.round(total * 100) / 100;
}

export const recommendationLabel: Record<GateDecisionType, string> = {
  aprovada: "Aprovar",
  "revisão": "Revisar",
  rejeitada: "Rejeitar",
};

export interface GateReviewSummary {
  id: string;
  round: number;
  status: ReviewStatus;
  openedAt: string;
  deadlineAt: string | null;
  overdue: boolean;
  consolidatedScore: number | null;
  recommendation: GateDecisionType | null;
  reopenedAfterRevision: boolean;
  idea: Idea;
  gate: GateSummary;
  evaluators: { id: string; name: string; submitted: boolean }[];
  suggestedEvaluatorIds: string[];
}

export interface GateReviewDetail extends GateReviewSummary {
  criteria: GateCriterion[];
  evaluations: {
    id: string;
    evaluatorId: string;
    evaluatorName: string;
    score: number;
    justification: string;
    criteria: { criterionId?: string; name: string; weight: number; score: number; comment?: string }[];
    createdAt: string;
  }[];
}

type ApiReview = Omit<GateReviewSummary, "idea" | "recommendation"> & {
  idea: ApiIdea;
  recommendation: ApiDecision | null;
};

function fromApi<T extends ApiReview>(r: T) {
  return {
    ...r,
    idea: toIdea(r.idea),
    recommendation: r.recommendation ? decisionFromApi[r.recommendation] : null,
  };
}

export async function listGateReviews(status: ReviewStatus, token: string): Promise<GateReviewSummary[]> {
  const list = await apiRequest<ApiReview[]>(`/gate-reviews?status=${status}`, { token });
  return list.map(fromApi);
}

export async function getGateReview(id: string, token: string): Promise<GateReviewDetail> {
  const r = await apiRequest<ApiReview & Pick<GateReviewDetail, "criteria" | "evaluations">>(
    `/gate-reviews/${encodeURIComponent(id)}`,
    { token },
  );
  return fromApi(r);
}

export async function listTriageIdeas(token: string): Promise<Idea[]> {
  const list = await apiRequest<ApiIdea[]>("/ideas?status=AGUARDANDO_TRIAGEM", { token });
  // Mais antigas primeiro: quem espera há mais tempo é triado antes
  return list.map((i) => toIdea(i)).reverse();
}

export function listEvaluators(token: string): Promise<{ id: string; name: string; email: string }[]> {
  return apiRequest("/users/evaluators", { token });
}

export function assignEvaluators(reviewId: string, evaluatorIds: string[], token: string): Promise<unknown> {
  return apiRequest(`/gate-reviews/${encodeURIComponent(reviewId)}/evaluators`, {
    method: "POST",
    token,
    body: { evaluatorIds },
  });
}

export function decideGate(
  reviewId: string,
  input: { decision: ApiDecision; feedback: string; reviewPoints?: string[] },
  token: string,
): Promise<{ idea: ApiIdea }> {
  return apiRequest(`/gate-reviews/${encodeURIComponent(reviewId)}/decision`, {
    method: "POST",
    token,
    body: input,
  });
}
