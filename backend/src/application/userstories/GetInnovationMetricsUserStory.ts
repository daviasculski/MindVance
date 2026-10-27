import { Idea } from "../../domain/entities/Idea";
import { IdeaStage, ideaStages } from "../../domain/entities/IdeaStage";
import { IdeaStatus, ideaStatuses } from "../../domain/entities/IdeaStatus";
import { IGateDecisionRepository } from "../../domain/repositories/IGateDecisionRepository";
import { IGateRepository } from "../../domain/repositories/IGateRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { furthestStageIndex, stageJourney } from "../services/ideaJourney";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface MetricsPeriodDTO {
  startDate?: string;
  endDate?: string;
}

export interface InnovationMetrics {
  period: { startDate: string | null; endDate: string | null };
  totalIdeas: number;
  ideasByStage: Record<IdeaStage, number>;
  ideasByArea: Record<string, number>;
  ideasByStatus: Record<IdeaStatus, number>;
  /** KPI-01: submissões por mês (AAAA-MM) */
  submissionsByMonth: { month: string; count: number }[];
  /** Sobrevivência do funil: quantas ideias chegaram a cada estágio */
  reachedByStage: { stage: IdeaStage; count: number }[];
  /** KPI-02: decisões e taxa de aprovação por gate */
  gateConversion: {
    gateOrder: number;
    gateName: string;
    decided: number;
    approved: number;
    revised: number;
    rejected: number;
    /** aprovadas / ideias que passaram pela decisão do gate (0–1); null sem decisões */
    approvalRate: number | null;
  }[];
  /** KPI-03: tempo médio (dias) em cada estágio que tem gate de saída */
  avgDaysByStage: { stage: IdeaStage; days: number | null; samples: number }[];
  /** KPI-05: projetos aprovados em desenvolvimento (passaram pelo G3) */
  inDevelopment: { id: string; title: string; stage: IdeaStage; status: IdeaStatus; department: string }[];
}

function parseDate(value: string | undefined, label: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label}`);
  }
  return date;
}

function departmentOf(idea: Idea): string {
  // "department" é a chave usada pelo formulário de nova ideia do frontend
  const area = [idea.extraFields?.area, idea.extraFields?.departamento, idea.extraFields?.department].find(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  return area?.trim() ?? "Não informado";
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Painel de indicadores (Módulo 6). Leitura para o Gestor e o Administrador (D12). */
export class GetInnovationMetricsUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly gateRepository: IGateRepository,
    private readonly gateDecisionRepository: IGateDecisionRepository,
  ) {}

  async execute(period: MetricsPeriodDTO = {}): Promise<InnovationMetrics> {
    const start = parseDate(period.startDate, "start date");
    const end = parseDate(period.endDate, "end date");
    if (start && end && start > end) {
      throw new Error("Start date must be before end date");
    }

    // O período recorta as ideias pela data de submissão
    const [ideas, gates, allDecisions] = await Promise.all([
      this.ideaRepository.findAll({ startDate: period.startDate, endDate: period.endDate }),
      this.gateRepository.findAll(),
      this.gateDecisionRepository.findAll(),
    ]);
    const ideaIds = new Set(ideas.map((i) => i.id));
    const decisions = allDecisions.filter((d) => ideaIds.has(d.ideaId));

    const ideasByStage = Object.fromEntries(ideaStages.map((s) => [s, 0])) as Record<IdeaStage, number>;
    const ideasByStatus = Object.fromEntries(ideaStatuses.map((s) => [s, 0])) as Record<IdeaStatus, number>;
    const ideasByArea = new Map<string, number>();
    for (const idea of ideas) {
      ideasByStage[idea.currentStage] += 1;
      ideasByStatus[idea.status] += 1;
      const area = departmentOf(idea);
      ideasByArea.set(area, (ideasByArea.get(area) ?? 0) + 1);
    }

    // Série mensal contínua (meses sem submissão aparecem com 0)
    const firstDate =
      start ??
      (ideas.length > 0
        ? new Date(Math.min(...ideas.map((i) => i.createdAt!.getTime())))
        : new Date(Date.now() - 150 * DAY_MS));
    const lastDate = end ?? new Date();
    const counts = new Map<string, number>();
    for (const idea of ideas) {
      const key = monthKey(idea.createdAt!);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const submissionsByMonth: { month: string; count: number }[] = [];
    const cursor = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    while (cursor <= lastDate && submissionsByMonth.length < 36) {
      const key = monthKey(cursor);
      submissionsByMonth.push({ month: key, count: counts.get(key) ?? 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const reachedByStage = ideaStages.map((stage, i) => ({
      stage,
      count: ideas.filter((idea) => furthestStageIndex(idea) >= i).length,
    }));

    const gateConversion = gates.map((gate) => {
      const ofGate = decisions.filter((d) => d.stage === gate.fromStage);
      const approved = ofGate.filter((d) => d.decision === "APROVADA").length;
      const rejected = ofGate.filter((d) => d.decision === "REJEITADA").length;
      // Ideias que encerraram o gate (aprovadas ou rejeitadas); revisões ainda voltam ao mesmo gate
      const concluded = approved + rejected;
      return {
        gateOrder: gate.orderIndex,
        gateName: gate.name,
        decided: ofGate.length,
        approved,
        revised: ofGate.filter((d) => d.decision === "REVISAO").length,
        rejected,
        approvalRate: concluded > 0 ? approved / concluded : null,
      };
    });

    // Tempo de permanência: estadias concluídas e, para ideias ativas, até hoje
    const now = Date.now();
    const durations = new Map<IdeaStage, number[]>();
    for (const idea of ideas) {
      for (const stay of stageJourney(idea, decisions)) {
        const finished = stay.leftAt !== null;
        const active = !finished && idea.status !== "REJEITADA" && idea.status !== "APROVADA";
        if (!finished && !active) continue;
        const endMs = stay.leftAt?.getTime() ?? now;
        const list = durations.get(stay.stage) ?? [];
        list.push((endMs - stay.enteredAt.getTime()) / DAY_MS);
        durations.set(stay.stage, list);
      }
    }
    const avgDaysByStage = gates.map((gate) => {
      const list = durations.get(gate.fromStage) ?? [];
      return {
        stage: gate.fromStage,
        days: list.length > 0 ? Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10 : null,
        samples: list.length,
      };
    });

    const developmentStages: IdeaStage[] = ["DESENVOLVIMENTO", "TESTE_E_VALIDACAO"];
    const inDevelopment = ideas
      .filter((i) => developmentStages.includes(i.currentStage) && i.status !== "REJEITADA")
      .map((i) => ({
        id: i.id!,
        title: i.title,
        stage: i.currentStage,
        status: i.status,
        department: departmentOf(i),
      }));

    return {
      period: { startDate: period.startDate ?? null, endDate: period.endDate ?? null },
      totalIdeas: ideas.length,
      ideasByStage,
      ideasByArea: Object.fromEntries(ideasByArea),
      ideasByStatus,
      submissionsByMonth,
      reachedByStage,
      gateConversion,
      avgDaysByStage,
      inDevelopment,
    };
  }
}
