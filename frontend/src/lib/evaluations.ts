import type { Stage } from "../types";
import { apiRequest } from "./api";
import { stageFromApi, type ApiStage, type IdeaExtraFields } from "./ideas";
import type { GateCriterion, GateThresholds } from "./gateReviews";

export const MAX_SCORE = 10;

/** Nota de um critério na tela; null enquanto o avaliador não deu nota (UC02 FA01). */
export interface CriterionInput extends GateCriterion {
  score: number | null;
  comment: string;
}

export interface PendingEvaluation {
  reviewId: string;
  ideaId: string;
  title: string;
  solution: string;
  authorName: string;
  extra: Partial<IdeaExtraFields>;
  stage: Stage;
  createdAt: string;
  gate: GateThresholds & { orderIndex: number; name: string; criteria: GateCriterion[] };
  round: number;
  deadlineAt: string | null;
  overdue: boolean;
}

export interface CompletedEvaluation {
  id: string;
  ideaId: string;
  ideaTitle: string;
  stage: Stage;
  round: number | null;
  score: number;
  createdAt: string;
}

interface ApiQueue {
  pending: (Omit<PendingEvaluation, "solution" | "extra" | "stage"> & {
    description: string;
    extraFields: Partial<IdeaExtraFields> | null;
    currentStage: ApiStage;
  })[];
  completed: (Omit<CompletedEvaluation, "stage"> & { stage: ApiStage })[];
}

export async function getEvaluationQueue(
  token: string,
): Promise<{ pending: PendingEvaluation[]; completed: CompletedEvaluation[] }> {
  const data = await apiRequest<ApiQueue>("/evaluations/queue", { token });
  return {
    pending: data.pending.map(({ description, extraFields, currentStage, ...p }) => ({
      ...p,
      solution: description,
      extra: extraFields ?? {},
      stage: stageFromApi[currentStage] ?? "Ideação",
    })),
    completed: data.completed.map((c) => ({
      ...c,
      stage: stageFromApi[c.stage] ?? "Ideação",
    })),
  };
}

/** O backend recalcula a nota a partir dos critérios; o front só envia as notas. */
export function submitEvaluation(
  input: { reviewId: string; justification: string; criteria: CriterionInput[] },
  token: string,
): Promise<unknown> {
  return apiRequest("/evaluations", {
    method: "POST",
    token,
    body: {
      reviewId: input.reviewId,
      justification: input.justification.trim(),
      criteria: input.criteria.map((c) => ({
        criterionId: c.id,
        score: c.score,
        ...(c.comment.trim() ? { comment: c.comment.trim() } : {}),
      })),
    },
  });
}
