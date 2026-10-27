import { Prisma } from "@prisma/client";
import { GateDecisionType } from "../../domain/entities/GateDecision";
import { GateReview, GateReviewStatus } from "../../domain/entities/GateReview";
import { IGateReviewRepository } from "../../domain/repositories/IGateReviewRepository";
import prisma from "../database/prisma/client";

const withEvaluators = {
  evaluators: { orderBy: { assignedAt: "asc" } },
} satisfies Prisma.GateReviewInclude;

type RawReview = Prisma.GateReviewGetPayload<{ include: typeof withEvaluators }>;

function toReview(raw: RawReview): GateReview {
  return {
    id: raw.id,
    ideaId: raw.ideaId,
    gateId: raw.gateId,
    round: raw.round,
    status: raw.status,
    requestedById: raw.requestedById,
    openedAt: raw.openedAt,
    deadlineAt: raw.deadlineAt,
    consolidatedScore: raw.consolidatedScore,
    recommendation: raw.recommendation,
    overdueAt: raw.overdueAt,
    evaluators: raw.evaluators.map((e) => ({
      evaluatorId: e.evaluatorId,
      assignedById: e.assignedById,
      assignedAt: e.assignedAt,
    })),
  };
}

export class PrismaGateReviewRepository implements IGateReviewRepository {
  async create(data: {
    ideaId: string;
    gateId: string;
    round: number;
    requestedById: string;
  }): Promise<GateReview> {
    const raw = await prisma.gateReview.create({ data, include: withEvaluators });
    return toReview(raw);
  }

  async findById(id: string): Promise<GateReview | null> {
    const raw = await prisma.gateReview.findUnique({ where: { id }, include: withEvaluators });
    return raw ? toReview(raw) : null;
  }

  async findByIdea(ideaId: string): Promise<GateReview[]> {
    const list = await prisma.gateReview.findMany({
      where: { ideaId },
      include: withEvaluators,
      orderBy: { openedAt: "asc" },
    });
    return list.map(toReview);
  }

  async lastRound(ideaId: string, gateId: string): Promise<number> {
    const result = await prisma.gateReview.aggregate({
      where: { ideaId, gateId },
      _max: { round: true },
    });
    return result._max.round ?? 0;
  }

  async findAll(): Promise<GateReview[]> {
    const list = await prisma.gateReview.findMany({
      include: withEvaluators,
      orderBy: { openedAt: "asc" },
    });
    return list.map(toReview);
  }

  async findByStatus(status: GateReviewStatus): Promise<GateReview[]> {
    const list = await prisma.gateReview.findMany({
      where: { status },
      include: withEvaluators,
      orderBy: { openedAt: "asc" },
    });
    return list.map(toReview);
  }

  async findAssignedTo(evaluatorId: string, status: GateReviewStatus): Promise<GateReview[]> {
    const list = await prisma.gateReview.findMany({
      where: { status, evaluators: { some: { evaluatorId } } },
      include: withEvaluators,
      orderBy: { deadlineAt: "asc" },
    });
    return list.map(toReview);
  }

  async assignEvaluators(
    reviewId: string,
    evaluatorIds: string[],
    assignedById: string,
    deadlineAt: Date,
  ): Promise<GateReview> {
    const raw = await prisma.gateReview.update({
      where: { id: reviewId },
      data: {
        status: "EM_AVALIACAO",
        deadlineAt,
        evaluators: {
          create: evaluatorIds.map((evaluatorId) => ({ evaluatorId, assignedById })),
        },
      },
      include: withEvaluators,
    });
    return toReview(raw);
  }

  async markReadyForDecision(
    reviewId: string,
    consolidatedScore: number,
    recommendation: GateDecisionType,
  ): Promise<GateReview> {
    const raw = await prisma.gateReview.update({
      where: { id: reviewId },
      data: { status: "AGUARDANDO_DECISAO", consolidatedScore, recommendation },
      include: withEvaluators,
    });
    return toReview(raw);
  }

  async markOverdue(reviewId: string, at: Date): Promise<GateReview> {
    const raw = await prisma.gateReview.update({
      where: { id: reviewId },
      data: { overdueAt: at },
      include: withEvaluators,
    });
    return toReview(raw);
  }

  async markDecided(reviewId: string): Promise<GateReview> {
    const raw = await prisma.gateReview.update({
      where: { id: reviewId },
      data: { status: "DECIDIDA" },
      include: withEvaluators,
    });
    return toReview(raw);
  }
}
