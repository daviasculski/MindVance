import type { GateDecisionType, Idea, IdeaStatus, Stage, TimelineEntry } from "../types";
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

export type ApiStatus =
  | "AGUARDANDO_TRIAGEM"
  | "AGUARDANDO_DESIGNACAO"
  | "EM_AVALIACAO"
  | "AGUARDANDO_DECISAO"
  | "EM_ANDAMENTO"
  | "EM_REVISAO"
  | "APROVADA"
  | "REJEITADA";

export const statusFromApi: Record<ApiStatus, IdeaStatus> = {
  AGUARDANDO_TRIAGEM: "Aguardando triagem",
  AGUARDANDO_DESIGNACAO: "Aguardando designação",
  EM_AVALIACAO: "Em avaliação",
  AGUARDANDO_DECISAO: "Aguardando decisão",
  EM_ANDAMENTO: "Em andamento",
  EM_REVISAO: "Em revisão",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
};

/** Status em que o autor pode editar e anexar entregas (fora do gate). */
export const editableStatuses: IdeaStatus[] = ["Aguardando triagem", "Em andamento", "Em revisão"];

/**
 * O autor solicita a revisão do gate nos G2–G5 (D6) ou o reenvio depois de
 * Revisar. O G1 é aberto pelo Gestor na triagem; o Lançamento não tem gate.
 */
export function canRequestGateReview(idea: Idea): boolean {
  if (idea.stage === "Lançamento") return false;
  return idea.status === "Em revisão" || (idea.status === "Em andamento" && idea.stage !== "Ideação");
}

/** Próximo passo esperado, exibido ao autor (ACO-07). */
export function nextStep(idea: Idea): string {
  switch (idea.status) {
    case "Aguardando triagem":
      return "O Gestor de Inovação vai fazer a triagem e abrir o Gate 1.";
    case "Aguardando designação":
      return "O Gestor de Inovação vai designar os avaliadores deste gate.";
    case "Em avaliação":
      return "Os avaliadores designados estão analisando a ideia. A edição fica bloqueada até a decisão.";
    case "Aguardando decisão":
      return "Todos os pareceres chegaram. O Gestor de Inovação vai tomar a decisão do gate.";
    case "Em andamento":
      return "Produza as entregas deste estágio e, quando estiverem prontas, solicite a revisão do gate.";
    case "Em revisão":
      return "Ajuste a ideia conforme o feedback e solicite uma nova revisão do gate.";
    case "Aprovada":
      return "A ideia passou por todos os gates e está aprovada para lançamento.";
    case "Rejeitada":
      return "A ideia foi encerrada nesta etapa. O histórico e a justificativa ficam preservados.";
  }
}

type ApiGateDecisionType = "APROVADA" | "REJEITADA" | "REVISAO";

export const decisionFromApi: Record<ApiGateDecisionType, GateDecisionType> = {
  APROVADA: "aprovada",
  REJEITADA: "rejeitada",
  REVISAO: "revisão",
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
  authorName?: string;
  extraFields: Partial<IdeaExtraFields> | null;
  currentStage: ApiStage;
  status: ApiStatus;
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
  stage: ApiStage;
  round: number | null;
  gateOrder: number | null;
  createdAt: string;
}

/** Ideias aprovadas no G5, que chegaram ao Lançamento (o estágio final). */
export function listLaunchIdeas(token: string): Promise<ApiIdea[]> {
  return apiRequest<ApiIdea[]>("/ideas?stage=LANCAMENTO", { token });
}

interface ApiGateDecision {
  id: string;
  stage: ApiStage;
  decision: ApiGateDecisionType;
  recommendation: ApiGateDecisionType | null;
  consolidatedScore: number | null;
  round: number | null;
  gateOrder: number | null;
  feedback: string;
  reviewPoints: string[] | null;
  deciderName?: string;
  createdAt: string;
}

/** Decisões de gate da ideia, já no formato de entradas do histórico. */
export async function listGateDecisions(ideaId: string, token: string): Promise<TimelineEntry[]> {
  const decisions = await apiRequest<ApiGateDecision[]>(
    `/ideas/${encodeURIComponent(ideaId)}/gate-decisions`,
    { token },
  );
  return decisions.map((d) => ({
    id: d.id,
    date: d.createdAt,
    stage: stageFromApi[d.stage],
    decision: decisionFromApi[d.decision],
    responsible: d.deciderName ?? "Gestor de Inovação",
    feedback: d.feedback,
    ...(d.reviewPoints ? { reviewPoints: d.reviewPoints } : {}),
    ...(d.recommendation ? { recommendation: decisionFromApi[d.recommendation] } : {}),
    ...(d.consolidatedScore !== null ? { score: d.consolidatedScore } : {}),
    ...(d.gateOrder !== null ? { gateOrder: d.gateOrder } : {}),
    ...(d.round !== null ? { round: d.round } : {}),
  }));
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
    stage: stageFromApi[e.stage],
    decision: "avaliada",
    responsible: e.evaluatorName,
    feedback: e.justification,
    score: e.score,
    ...(e.gateOrder !== null ? { gateOrder: e.gateOrder } : {}),
    ...(e.round !== null ? { round: e.round } : {}),
  }));
}

interface ApiIdeaGateReview {
  id: string;
  gateOrder: number | null;
  gateName: string;
  stage: ApiStage | null;
  round: number;
  openedAt: string;
  overdueAt: string | null;
}

/** Rodadas da ideia no histórico: abertura de cada gate e prazo vencido (GAT-11). */
export async function listIdeaGateReviews(ideaId: string, token: string): Promise<TimelineEntry[]> {
  const reviews = await apiRequest<ApiIdeaGateReview[]>(
    `/ideas/${encodeURIComponent(ideaId)}/gate-reviews`,
    { token },
  );
  return reviews.flatMap((r) => {
    const base = {
      ...(r.stage ? { stage: stageFromApi[r.stage] } : {}),
      ...(r.gateOrder !== null ? { gateOrder: r.gateOrder } : {}),
      round: r.round,
    };
    const triage = r.gateOrder === 1 && r.round === 1;
    const opened: TimelineEntry = {
      id: `${r.id}-aberto`,
      date: r.openedAt,
      decision: "gate-aberto",
      responsible: triage ? "Gestor de Inovação (triagem)" : "Solicitado pelo autor",
      feedback: r.round > 1 ? `${r.gateName} reaberto após a revisão.` : `${r.gateName} aberto para avaliação.`,
      ...base,
    };
    if (!r.overdueAt) return [opened];
    return [
      opened,
      {
        id: `${r.id}-atraso`,
        date: r.overdueAt,
        decision: "atraso",
        responsible: "Sistema",
        feedback: "O prazo venceu com pareceres pendentes. A avaliação continua aberta.",
        ...base,
      },
    ];
  });
}

export async function getIdea(id: string, token: string): Promise<Idea> {
  return toIdea(await apiRequest<ApiIdea>(`/ideas/${encodeURIComponent(id)}`, { token }));
}

/** Autor edita a ideia (só fora do gate). Não reenvia: o reenvio é por requestGateReview. */
export function updateIdea(id: string, input: NewIdeaInput, token: string): Promise<ApiIdea> {
  return apiRequest<ApiIdea>(`/ideas/${encodeURIComponent(id)}`, {
    method: "PUT",
    token,
    body: { title: input.title.trim(), description: input.solution.trim(), extraFields: toExtraFields(input) },
  });
}

/** Abre uma rodada: o Gestor abre o G1 na triagem; o autor solicita G2–G5 ou o reenvio após Revisar. */
export function openGateReview(
  ideaId: string,
  token: string,
): Promise<{ reviewId: string; gateOrder: number; round: number }> {
  return apiRequest(`/ideas/${encodeURIComponent(ideaId)}/gate-reviews`, { method: "POST", token });
}

/**
 * Converte a ideia do backend para o formato usado pelas telas.
 * O histórico começa só com a submissão: avaliações e decisões de gate são
 * buscadas à parte (listIdeaEvaluations e listGateDecisions). O backend ainda
 * não tem anexos.
 */
export function toIdea(api: ApiIdea, fallbackAuthorName = "Colaborador"): Idea {
  const extra = api.extraFields ?? {};
  const stage = stageFromApi[api.currentStage] ?? "Ideação";
  const authorName = api.authorName ?? fallbackAuthorName;
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    problem: extra.problem ?? "",
    solution: api.description,
    authorId: api.authorId,
    author: authorName,
    department: extra.department ?? "",
    stage,
    status: statusFromApi[api.status] ?? "Em andamento",
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

function toExtraFields(input: NewIdeaInput): IdeaExtraFields {
  return {
    problem: input.problem.trim(),
    department: input.department,
    ...(input.impact.trim() ? { impact: input.impact.trim() } : {}),
    ...(input.resources.trim() ? { resources: input.resources.trim() } : {}),
  };
}

/** Mapeamento: solução proposta -> description; o restante -> extraFields. */
export function createIdea(input: NewIdeaInput, token: string): Promise<ApiIdea> {
  return apiRequest<ApiIdea>("/ideas", {
    method: "POST",
    token,
    body: {
      title: input.title.trim(),
      description: input.solution.trim(),
      extraFields: toExtraFields(input),
    },
  });
}
