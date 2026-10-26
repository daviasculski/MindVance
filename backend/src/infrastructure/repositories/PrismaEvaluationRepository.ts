import { Prisma, Evaluation as PrismaEvaluation } from "@prisma/client";
import {
  Evaluation,
  EvaluationCriterion,
} from "../../domain/entities/Evaluation";
import { IEvaluationRepository } from "../../domain/repositories/IEvaluationRepository";
import prisma from "../database/prisma/client";

function toEntity(raw: PrismaEvaluation): Evaluation {
  return new Evaluation({
    id: raw.id,
    ideaId: raw.ideaId,
    evaluatorId: raw.evaluatorId,
    score: raw.score,
    justification: raw.justification,
    stage: raw.stage,
    criteria: raw.criteria as EvaluationCriterion[] | null,
    reviewId: raw.reviewId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}

export class PrismaEvaluationRepository implements IEvaluationRepository {
  async create(evaluation: Evaluation): Promise<Evaluation> {
    const raw = await prisma.evaluation.create({
      data: {
        ideaId: evaluation.ideaId,
        evaluatorId: evaluation.evaluatorId,
        score: evaluation.score,
        justification: evaluation.justification,
        stage: evaluation.stage,
        reviewId: evaluation.reviewId,
        criteria: evaluation.criteria
          ? (evaluation.criteria as unknown as Prisma.InputJsonValue)
          : Prisma.DbNull,
      },
    });

    return toEntity(raw);
  }

  async findByIdeaId(ideaId: string): Promise<Evaluation[]> {
    const evaluations = await prisma.evaluation.findMany({
      where: { ideaId },
      orderBy: { createdAt: "desc" },
    });

    return evaluations.map(toEntity);
  }

  async findByReviewId(reviewId: string): Promise<Evaluation[]> {
    const evaluations = await prisma.evaluation.findMany({
      where: { reviewId },
      orderBy: { createdAt: "asc" },
    });

    return evaluations.map(toEntity);
  }

  async findByEvaluatorId(evaluatorId: string): Promise<Evaluation[]> {
    const evaluations = await prisma.evaluation.findMany({
      where: { evaluatorId },
      orderBy: { createdAt: "desc" },
    });

    return evaluations.map(toEntity);
  }
}
