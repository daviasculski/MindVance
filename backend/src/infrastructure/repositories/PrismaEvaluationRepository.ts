import { Evaluation } from "../../domain/entities/Evaluation";
import { IEvaluationRepository } from "../../domain/repositories/IEvaluationRepository";
import prisma from "../database/prisma/client";

export class PrismaEvaluationRepository implements IEvaluationRepository {
  async create(evaluation: Evaluation): Promise<Evaluation> {
    const raw = await prisma.evaluation.create({
      data: {
        ideaId: evaluation.ideaId,
        evaluatorId: evaluation.evaluatorId,
        score: evaluation.score,
        justification: evaluation.justification,
      },
    });

    return new Evaluation({
      id: raw.id,
      ideaId: raw.ideaId,
      evaluatorId: raw.evaluatorId,
      score: raw.score,
      justification: raw.justification,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findByIdeaId(ideaId: string): Promise<Evaluation[]> {
    const evaluations = await prisma.evaluation.findMany({
      where: { ideaId },
      orderBy: { createdAt: "desc" },
    });

    return evaluations.map(
      (raw) =>
        new Evaluation({
          id: raw.id,
          ideaId: raw.ideaId,
          evaluatorId: raw.evaluatorId,
          score: raw.score,
          justification: raw.justification,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        }),
    );
  }
}
