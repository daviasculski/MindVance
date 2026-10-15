import type { Idea, Stage, TimelineEntry } from "../types";
import { apiRequest } from "./api";

/** Estágios como o backend os representa (enum IdeaStage do Prisma). */
export type ApiStage =
  | "IDEACAO"
  | "ESCOPO"
  | "PLANO_DE_NEGOCIOS"
  | "DESENVOLVIMENTO"
  | "TESTE_E_VALIDACAO"
  | "LANCAMENTO";

export const stageFromApi: Record<ApiStage, Stage> = {
  IDEACAO: "Ideação",
  ESCOPO: "Escopo",
  PLANO_DE_NEGOCIOS: "Plano de Negócios",
  DESENVOLVIMENTO: "Desenvolvimento",
  TESTE_E_VALIDACAO: "Teste e Validação",
  LANCAMENTO: "Lançamento",
};

/** Campos do formulário que o modelo Idea não tem coluna própria: vão em extraFields. */
export interface IdeaExtraFields {
  problem: string;
  department: string;
  impact?: string;
  resources?: string;
}

export interface ApiIdea {
  id: string;
  title: string;
  description: string;
  authorId: string;
  extraFields: Partial<IdeaExtraFields> | null;
  currentStage: ApiStage;
  createdAt: string;
  updatedAt: string;
}

export interface NewIdeaInput {
  title: string;
  problem: string;
  solution: string;
  department: string;
  impact: string;
  resources: string;
}

export function listIdeasByAuthor(authorId: string, token: string): Promise<ApiIdea[]> {
  return apiRequest<ApiIdea[]>(`/ideas?authorId=${encodeURIComponent(authorId)}`, { token });
}

interface ApiIdeaEvaluation {
  id: string;
  evaluatorId: string;
  evaluatorName: string;
  score: number;
  justification: string;
  createdAt: string;
}

/** Avaliações da ideia, já no formato de entradas do histórico (ordem cronológica). */
export async function listIdeaEvaluations(ideaId: string, token: string): Promise<TimelineEntry[]> {
  const evaluations = await apiRequest<ApiIdeaEvaluation[]>(
    `/ideas/${encodeURIComponent(ideaId)}/evaluations`,
    { token },
  );
  return evaluations.map((e) => ({
    id: e.id,
    date: e.createdAt,
    decision: "avaliada",
    responsible: e.evaluatorName,
    feedback: e.justification,
    score: e.score,
  }));
}

/**
 * Converte a ideia do backend para o formato usado pelas telas.
 * O backend ainda não tem status, anexos nem decisões de gate: a ideia aparece
 * "Em andamento" e o histórico começa só com a submissão (as avaliações são
 * buscadas à parte, com listIdeaEvaluations).
 */
export function toIdea(api: ApiIdea, authorName: string): Idea {
  const extra = api.extraFields ?? {};
  const stage = stageFromApi[api.currentStage] ?? "Ideação";
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    problem: extra.problem ?? "",
    solution: api.description,
    author: authorName,
    department: extra.department ?? "",
    stage,
    status: "Em andamento",
    impact: extra.impact ?? "",
    resources: extra.resources ?? "",
    submittedAt: api.createdAt,
    attachments: [],
    timeline: [
      {
        id: `${api.id}-submetida`,
        date: api.createdAt,
        stage: "Ideação",
        decision: "submetida",
        responsible: authorName,
        feedback: "Ideia submetida ao funil de inovação.",
      },
    ],
  };
}

/** Mapeamento: solução proposta -> description; o restante -> extraFields. */
export function createIdea(input: NewIdeaInput, token: string): Promise<ApiIdea> {
  const extraFields: IdeaExtraFields = {
    problem: input.problem.trim(),
    department: input.department,
    ...(input.impact.trim() ? { impact: input.impact.trim() } : {}),
    ...(input.resources.trim() ? { resources: input.resources.trim() } : {}),
  };

  return apiRequest<ApiIdea>("/ideas", {
    method: "POST",
    token,
    body: {
      title: input.title.trim(),
      description: input.solution.trim(),
      extraFields,
    },
  });
}
