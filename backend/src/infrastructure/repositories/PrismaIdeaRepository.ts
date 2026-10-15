import {
  IIdeaRepository,
  IdeaFilters,
  UpdateIdeaData,
} from "../../domain/repositories/IIdeaRepository";
import { Idea } from "../../domain/entities/Idea";
import { IdeaStage, isIdeaStage } from "../../domain/entities/IdeaStage";
import prisma from "../database/prisma/client";
import { Prisma } from "@prisma/client";

export class PrismaIdeaRepository implements IIdeaRepository {
  async create(idea: Idea): Promise<Idea> {
    const raw = await prisma.idea.create({
      data: {
        ...(idea.id ? { id: idea.id } : {}),
        title: idea.title,
        description: idea.description,
        author_id: idea.authorId,
        extra_fields: (idea.extraFields ?? {}) as Prisma.InputJsonValue,
      },
    });

    return new Idea({
      id: raw.id,
      title: raw.title,
      description: raw.description,
      authorId: raw.author_id,
      extraFields: raw.extra_fields as Record<string, unknown> | null,
      currentStage: raw.current_stage,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  async findById(id: string): Promise<Idea | null> {
    const raw = await prisma.idea.findUnique({
      where: { id },
    });

    if (!raw) {
      return null;
    }

    return new Idea({
      id: raw.id,
      title: raw.title,
      description: raw.description,
      authorId: raw.author_id,
      extraFields: raw.extra_fields as Record<string, unknown> | null,
      currentStage: raw.current_stage,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  async findAll(filters?: IdeaFilters): Promise<Idea[]> {
    const where: Prisma.IdeaWhereInput = {};

    if (filters?.stage) {
      if (!isIdeaStage(filters.stage)) {
        throw new Error(`Invalid idea stage filter: ${filters.stage}`);
      }
      where.current_stage = filters.stage;
    }

    if (filters?.authorId) {
      where.author_id = filters.authorId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {
        ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
        ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
      };
    }

    const list = await prisma.idea.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    return list.map(
      (raw) =>
        new Idea({
          id: raw.id,
          title: raw.title,
          description: raw.description,
          authorId: raw.author_id,
          extraFields: raw.extra_fields as Record<string, unknown> | null,
          currentStage: raw.current_stage,
          createdAt: raw.created_at,
          updatedAt: raw.updated_at,
        }),
    );
  }

  async update(id: string, data: UpdateIdeaData): Promise<Idea> {
    const raw = await prisma.idea.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.authorId !== undefined ? { author_id: data.authorId } : {}),
        ...(data.extraFields !== undefined
          ? {
              extra_fields: (data.extraFields ?? {}) as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    return new Idea({
      id: raw.id,
      title: raw.title,
      description: raw.description,
      authorId: raw.author_id,
      extraFields: raw.extra_fields as Record<string, unknown> | null,
      currentStage: raw.current_stage,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  async updateStage(id: string, stage: IdeaStage): Promise<Idea> {
    const raw = await prisma.idea.update({
      where: { id },
      data: { current_stage: stage },
    });

    return new Idea({
      id: raw.id,
      title: raw.title,
      description: raw.description,
      authorId: raw.author_id,
      extraFields: raw.extra_fields as Record<string, unknown> | null,
      currentStage: raw.current_stage,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.idea.delete({
      where: { id },
    });
  }
}
