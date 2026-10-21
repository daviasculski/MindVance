import { GateDecision as PrismaGateDecision, Prisma } from "@prisma/client";
import { GateDecision } from "../../domain/entities/GateDecision";
import { IGateDecisionRepository } from "../../domain/repositories/IGateDecisionRepository";
import prisma from "../database/prisma/client";

function toEntity(raw: PrismaGateDecision): GateDecision {
  return new GateDecision({
    id: raw.id,
    ideaId: raw.ideaId,
    stage: raw.stage,
    decision: raw.decision,
    feedback: raw.feedback,
    reviewPoints: raw.reviewPoints as string[] | null,
    deciderId: raw.deciderId,
    createdAt: raw.createdAt,
  });
}

export class PrismaGateDecisionRepository implements IGateDecisionRepository {
  async create(decision: GateDecision): Promise<GateDecision> {
    const raw = await prisma.gateDecision.create({
      data: {
        ideaId: decision.ideaId,
        stage: decision.stage,
        decision: decision.decision,
        feedback: decision.feedback,
        reviewPoints: decision.reviewPoints ?? Prisma.DbNull,
        deciderId: decision.deciderId,
      },
    });

    return toEntity(raw);
  }

  async findByIdeaId(ideaId: string): Promise<GateDecision[]> {
    const list = await prisma.gateDecision.findMany({
      where: { ideaId },
      orderBy: { createdAt: "asc" },
    });

    return list.map(toEntity);
  }
}
