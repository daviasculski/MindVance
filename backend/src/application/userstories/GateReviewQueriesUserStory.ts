import { Gate } from "../../domain/entities/Gate";
import { GateReview, GateReviewStatus } from "../../domain/entities/GateReview";
import { IEvaluationRepository } from "../../domain/repositories/IEvaluationRepository";
import { IGateRepository } from "../../domain/repositories/IGateRepository";
import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IdeaOutputDTO, toIdeaOutputDTO } from "../dtos/IdeaDTO";

const reviewStatuses: GateReviewStatus[] = [
  "AGUARDANDO_DESIGNACAO",
  "EM_AVALIACAO",
  "AGUARDANDO_DECISAO",
  "DECIDIDA",
];

export interface GateSummaryDTO {
  id: string;
  orderIndex: number;
  name: string;
  deliverable: string;
  deadlineDays: number;
  approveThreshold: number;
  reviseThreshold: number;
  /** Aprovar este gate leva ao estágio final (sem gate de saída): encerra o ciclo (P2) */
  leadsToFinalStage: boolean;
}

export interface GateReviewSummaryDTO {
  id: string;
  round: number;
  status: GateReviewStatus;
  openedAt: Date;
  deadlineAt: Date | null;
  overdue: boolean;
  consolidatedScore: number | null;
  recommendation: string | null;
  /** Rodada reaberta após Revisar (round > 1) ou abertura normal */
  reopenedAfterRevision: boolean;
  idea: IdeaOutputDTO;
  gate: GateSummaryDTO;
  evaluators: { id: string; name: string; submitted: boolean }[];
  /** Avaliadores da rodada anterior do mesmo gate, para pré-preencher a designação (P4) */
  suggestedEvaluatorIds: string[];
}

export interface GateReviewDetailDTO extends GateReviewSummaryDTO {
  criteria: Gate["criteria"];
  evaluations: {
    id: string;
    evaluatorId: string;
    evaluatorName: string;
    score: number;
    justification: string;
    criteria: { criterionId?: string; name: string; weight: number; score: number; comment?: string }[];
    createdAt: Date;
  }[];
}

function toGateSummary(gate: Gate, gates: Gate[]): GateSummaryDTO {
  return {
    leadsToFinalStage: !gates.some((g) => g.fromStage === gate.toStage),
    id: gate.id,
    orderIndex: gate.orderIndex,
    name: gate.name,
    deliverable: gate.deliverable,
    deadlineDays: gate.deadlineDays,
    approveThreshold: gate.approveThreshold,
    reviseThreshold: gate.reviseThreshold,
  };
}

/** Consultas do Gestor sobre as rodadas de gate (filas de designação, avaliação e decisão). */
export class GateReviewQueriesUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly gateRepository: IGateRepository,
    private readonly gateReviewRepository: IGateReviewRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async listGates(): Promise<(GateSummaryDTO & { fromStage: string; toStage: string; criteria: Gate["criteria"] })[]> {
    const gates = await this.gateRepository.findAll();
    return gates.map((g) => ({ ...toGateSummary(g, gates), fromStage: g.fromStage, toStage: g.toStage, criteria: g.criteria }));
  }

  async listByStatus(status: unknown): Promise<GateReviewSummaryDTO[]> {
    if (!reviewStatuses.includes(status as GateReviewStatus)) {
      throw new Error("Invalid gate review status");
    }
    const reviews = await this.gateReviewRepository.findByStatus(status as GateReviewStatus);
    const gates = await this.gateRepository.findAll();
    const result: GateReviewSummaryDTO[] = [];
    for (const review of reviews) {
      const summary = await this.summarize(review, gates);
      if (summary) result.push(summary);
    }
    return result;
  }

  async detail(reviewId: string): Promise<GateReviewDetailDTO> {
    const review = await this.gateReviewRepository.findById(reviewId);
    if (!review) {
      throw new Error("Gate review not found");
    }
    const gates = await this.gateRepository.findAll();
    const summary = await this.summarize(review, gates);
    const gate = gates.find((g) => g.id === review.gateId);
    if (!summary || !gate) {
      throw new Error("Gate review not found");
    }

    const evaluations = await this.evaluationRepository.findByReviewId(review.id);
    const users = await this.userRepository.findByIds(evaluations.map((e) => e.evaluatorId));
    const nameById = new Map(users.map((u) => [u.id, u.name]));

    return {
      ...summary,
      criteria: gate.criteria,
      evaluations: evaluations.map((e) => ({
        id: e.id!,
        evaluatorId: e.evaluatorId,
        evaluatorName: nameById.get(e.evaluatorId) ?? "Avaliador",
        score: e.score,
        justification: e.justification,
        criteria: e.criteria ?? [],
        createdAt: e.createdAt!,
      })),
    };
  }

  private async summarize(review: GateReview, gates: Gate[]): Promise<GateReviewSummaryDTO | null> {
    const idea = await this.ideaRepository.findById(review.ideaId);
    const gate = gates.find((g) => g.id === review.gateId);
    if (!idea || !gate) return null;

    const [author] = await this.userRepository.findByIds([idea.authorId]);
    const evaluations = await this.evaluationRepository.findByReviewId(review.id);
    const evaluatorUsers = await this.userRepository.findByIds(review.evaluators.map((e) => e.evaluatorId));
    const nameById = new Map(evaluatorUsers.map((u) => [u.id, u.name]));

    let suggestedEvaluatorIds: string[] = [];
    if (review.status === "AGUARDANDO_DESIGNACAO" && review.round > 1) {
      const previous = (await this.gateReviewRepository.findByIdea(idea.id!)).find(
        (r) => r.gateId === review.gateId && r.round === review.round - 1,
      );
      suggestedEvaluatorIds = previous?.evaluators.map((e) => e.evaluatorId) ?? [];
    }

    return {
      id: review.id,
      round: review.round,
      status: review.status,
      openedAt: review.openedAt,
      deadlineAt: review.deadlineAt,
      overdue:
        review.status === "EM_AVALIACAO" &&
        review.deadlineAt !== null &&
        review.deadlineAt.getTime() < Date.now(),
      consolidatedScore: review.consolidatedScore,
      recommendation: review.recommendation,
      reopenedAfterRevision: review.round > 1,
      idea: toIdeaOutputDTO(idea, author?.name ?? "Colaborador"),
      gate: toGateSummary(gate, gates),
      evaluators: review.evaluators.map((e) => ({
        id: e.evaluatorId,
        name: nameById.get(e.evaluatorId) ?? "Avaliador",
        submitted: evaluations.some((ev) => ev.evaluatorId === e.evaluatorId),
      })),
      suggestedEvaluatorIds,
    };
  }
}
