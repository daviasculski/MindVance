import { ManualStageTransition as PrismaManualStageTransition } from "@prisma/client";
import { ManualStageTransition } from "../../domain/entities/ManualStageTransition";
import { IdeaStatus } from "../../domain/entities/IdeaStatus";
import { IManualStageTransitionRepository } from "../../domain/repositories/IManualStageTransitionRepository";
import prisma from "../database/prisma/client";

function toEntity(raw: PrismaManualStageTransition): ManualStageTransition {
  return {
    id: raw.id,
    ideaId: raw.ideaId,
    fromStage: raw.fromStage,
    toStage: raw.toStage,
    reason: raw.reason,
    changedById: raw.changedById,
    createdAt: raw.createdAt,
  };
}

export class PrismaManualStageTransitionRepository
  implements IManualStageTransitionRepository
{
  async moveIdea(input: {
    ideaId: string;
    expectedStage: ManualStageTransition["fromStage"];
    expectedStatus: IdeaStatus;
    toStage: ManualStageTransition["toStage"];
    toStatus: IdeaStatus;
    reason: string;
    changedById: string;
  }): Promise<ManualStageTransition> {
    return prisma.$transaction(async (transaction) => {
      const updated = await transaction.idea.updateMany({
        where: {
          id: input.ideaId,
          current_stage: input.expectedStage,
          status: input.expectedStatus,
        },
        data: {
          current_stage: input.toStage,
          status: input.toStatus,
        },
      });

      if (updated.count !== 1) {
        throw new Error("Idea changed while the stage transition was in progress");
      }

      const transition = await transaction.manualStageTransition.create({
        data: {
          ideaId: input.ideaId,
          fromStage: input.expectedStage,
          toStage: input.toStage,
          reason: input.reason,
          changedById: input.changedById,
        },
      });

      return toEntity(transition);
    });
  }

  async findByIdeaId(ideaId: string): Promise<ManualStageTransition[]> {
    const transitions = await prisma.manualStageTransition.findMany({
      where: { ideaId },
      orderBy: { createdAt: "asc" },
    });
    return transitions.map(toEntity);
  }

  async findAll(): Promise<ManualStageTransition[]> {
    const transitions = await prisma.manualStageTransition.findMany({
      orderBy: { createdAt: "asc" },
    });
    return transitions.map(toEntity);
  }
}
