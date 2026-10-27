import type { Idea, IdeaStatus, Stage } from "../types";
import { apiRequest } from "./api";
import { stageFromApi, statusFromApi, toIdea, type ApiIdea, type ApiStage, type ApiStatus } from "./ideas";

// ---------- Funil (Gestor) ----------

interface ApiFunnelIdea extends ApiIdea {
  lastMovementAt: string;
  currentRound: number | null;
  rejectionFeedback: string | null;
}

export interface FunnelIdea extends Idea {
  currentRound: number | null;
  rejectionFeedback: string | null;
}

export interface Funnel {
  ideas: FunnelIdea[];
  reachedByStage: { stage: Stage; count: number }[];
}

export async function getFunnel(token: string): Promise<Funnel> {
  const data = await apiRequest<{ ideas: ApiFunnelIdea[]; reachedByStage: { stage: ApiStage; count: number }[] }>(
    "/ideas/funnel",
    { token },
  );
  return {
    ideas: data.ideas.map((i) => ({
      ...toIdea(i),
      lastMovementAt: i.lastMovementAt,
      currentRound: i.currentRound,
      rejectionFeedback: i.rejectionFeedback,
    })),
    reachedByStage: data.reachedByStage.map((r) => ({ stage: stageFromApi[r.stage], count: r.count })),
  };
}

// ---------- Indicadores (Gestor; Admin só leitura) ----------

export interface Metrics {
  totalIdeas: number;
  ideasByStatus: Record<IdeaStatus, number>;
  ideasByArea: { area: string; count: number }[];
  submissionsByMonth: { month: string; label: string; count: number }[];
  reachedByStage: { stage: Stage; count: number }[];
  gateConversion: {
    gateOrder: number;
    gateName: string;
    decided: number;
    approved: number;
    revised: number;
    rejected: number;
    approvalRate: number | null;
  }[];
  avgDaysByStage: { stage: Stage; days: number | null; samples: number }[];
  inDevelopment: { id: string; title: string; stage: Stage; status: IdeaStatus; department: string }[];
}

interface ApiMetrics {
  totalIdeas: number;
  ideasByStatus: Record<ApiStatus, number>;
  ideasByArea: Record<string, number>;
  submissionsByMonth: { month: string; count: number }[];
  reachedByStage: { stage: ApiStage; count: number }[];
  gateConversion: Metrics["gateConversion"];
  avgDaysByStage: { stage: ApiStage; days: number | null; samples: number }[];
  inDevelopment: { id: string; title: string; stage: ApiStage; status: ApiStatus; department: string }[];
}

const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-10" → "out/26" */
function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  return `${monthNames[Number(month) - 1]}/${year.slice(2)}`;
}

/** Período pela data de submissão; datas no formato AAAA-MM-DD (fim do dia incluído). */
export async function getMetrics(period: { from?: string; to?: string }, token: string): Promise<Metrics> {
  const params = new URLSearchParams();
  if (period.from) params.set("startDate", `${period.from}T00:00:00`);
  if (period.to) params.set("endDate", `${period.to}T23:59:59.999`);
  const query = params.toString();
  const m = await apiRequest<ApiMetrics>(`/ideas/metrics${query ? `?${query}` : ""}`, { token });

  return {
    totalIdeas: m.totalIdeas,
    ideasByStatus: Object.fromEntries(
      Object.entries(m.ideasByStatus).map(([k, v]) => [statusFromApi[k as ApiStatus], v]),
    ) as Record<IdeaStatus, number>,
    ideasByArea: Object.entries(m.ideasByArea)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count),
    submissionsByMonth: m.submissionsByMonth.map((s) => ({ ...s, label: monthLabel(s.month) })),
    reachedByStage: m.reachedByStage.map((r) => ({ stage: stageFromApi[r.stage], count: r.count })),
    gateConversion: m.gateConversion,
    avgDaysByStage: m.avgDaysByStage.map((r) => ({ ...r, stage: stageFromApi[r.stage] })),
    inDevelopment: m.inDevelopment.map((i) => ({
      ...i,
      stage: stageFromApi[i.stage],
      status: statusFromApi[i.status],
    })),
  };
}
