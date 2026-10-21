import type { Stage } from "../types";
import { apiRequest } from "./api";
import { stageFromApi, type ApiStage, type IdeaExtraFields } from "./ideas";

export const MAX_SCORE = 10;
/** Nota mínima para a ideia ser considerada "acima da meta". */
export const PASS_THRESHOLD = 7;

export interface CriterionInput {
  name: string;
  weight: number;
  score: number;
  comment: string;
}

/** Critérios usados em todos os gates. Os pesos somam 100. */
export const DEFAULT_CRITERIA: { name: string; weight: number }[] = [
  { name: "Alinhamento Estratégico", weight: 30 },
  { name: "Viabilidade Técnica", weight: 25 },
  { name: "Potencial de Mercado", weight: 25 },
  { name: "Risco de Execução", weight: 20 },
];

export function weightedScore(criteria: CriterionInput[]): number {
  const total = criteria.reduce((acc, c) => acc + (c.score * c.weight) / 100, 0);
  return Math.round(total * 10) / 10;
}

export interface PendingEvaluation {
  ideaId: string;
  title: string;
  solution: string;
  authorName: string;
  extra: Partial<IdeaExtraFields>;
  stage: Stage;
  createdAt: string;
}

export interface CompletedEvaluation {
  id: string;
  ideaId: string;
  ideaTitle: string;
  stage: Stage;
  score: number;
  createdAt: string;
}

interface ApiQueue {
  pending: {
    ideaId: string;
    title: string;
    description: string;
    authorName: string;
    extraFields: Partial<IdeaExtraFields> | null;
    currentStage: ApiStage;
    createdAt: string;
  }[];
  completed: {
    id: string;
    ideaId: string;
    ideaTitle: string;
    stage: ApiStage;
    score: number;
    createdAt: string;
  }[];
}

export async function getEvaluationQueue(
  token: string,
): Promise<{ pending: PendingEvaluation[]; completed: CompletedEvaluation[] }> {
  const data = await apiRequest<ApiQueue>("/evaluations/queue", { token });
  return {
    pending: data.pending.map((p) => ({
      ideaId: p.ideaId,
      title: p.title,
      solution: p.description,
      authorName: p.authorName,
      extra: p.extraFields ?? {},
      stage: stageFromApi[p.currentStage] ?? "Ideação",
      createdAt: p.createdAt,
    })),
    completed: data.completed.map((c) => ({
      ...c,
      stage: stageFromApi[c.stage] ?? "Ideação",
    })),
  };
}

export function submitEvaluation(
  input: { ideaId: string; justification: string; criteria: CriterionInput[] },
  token: string,
): Promise<unknown> {
  return apiRequest("/evaluations", {
    method: "POST",
    token,
    body: {
      ideaId: input.ideaId,
      score: weightedScore(input.criteria),
      justification: input.justification.trim(),
      criteria: input.criteria.map((c) => ({
        name: c.name,
        weight: c.weight,
        score: c.score,
        ...(c.comment.trim() ? { comment: c.comment.trim() } : {}),
      })),
    },
  });
}
