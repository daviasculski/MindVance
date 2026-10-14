import type { Stage } from "../types";
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
