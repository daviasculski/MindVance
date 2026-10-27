import { GateDecision as PrismaGateDecision, Prisma } from "@prisma/client";
import { GateDecision } from "../../domain/entities/GateDecision";
import { IGateDecisionRepository } from "../../domain/repositories/IGateDecisionRepository";
import prisma from "../database/prisma/client";

function toEntity(raw: PrismaGateDecision): GateDecision {
  return new GateDecision({
    id: raw.id,
    ideaId: raw.ideaId,
    reviewId: raw.reviewId,
    stage: raw.stage,
    toStage: raw.toStage,
    decision: raw.decision,
    recommendation: raw.recommendation,
    consolidatedScore: raw.consolidatedScore,
    feedback: raw.feedback,
    reviewPoints: raw.reviewPoints as string[] | null,
    deciderId: raw.deciderId,
    createdAt: raw.createdAt,
  });
}

/** Só cria e lê: as transições são imutáveis (não há update nem delete). */
export class PrismaGateDecisionRepository implements IGateDecisionRepository {
  async create(decision: GateDecision): Promise<GateDecision> {
    const raw = await prisma.gateDecision.create({
      data: {
        ideaId: decision.ideaId,
        reviewId: decision.reviewId,
        stage: decision.stage,
        toStage: decision.toStage,
        decision: decision.decision,
        recommendation: decision.recommendation,
        consolidatedScore: decision.consolidatedScore,
        feedback: decision.feedback,
        reviewPoints: decision.reviewPoints ?? Prisma.DbNull,
        deciderId: decision.deciderId,
      },
    });

    return toEntity(raw);
  }

  async findAll(): Promise<GateDecision[]> {
    const list = await prisma.gateDecision.findMany({ orderBy: { createdAt: "asc" } });
    return list.map(toEntity);
  }

  async findByIdeaId(ideaId: string): Promise<GateDecision[]> {
    const list = await prisma.gateDecision.findMany({
      where: { ideaId },
      orderBy: { createdAt: "asc" },
    });

    return list.map(toEntity);
  }
}
