import {
  IIdeaRepository,
  IdeaFilters,
  IdeaProgressData,
  UpdateIdeaData,
} from "../../domain/repositories/IIdeaRepository";
import { Idea, IdeaCancellation } from "../../domain/entities/Idea";
import { IdeaStage, isIdeaStage } from "../../domain/entities/IdeaStage";
import { isIdeaStatus } from "../../domain/entities/IdeaStatus";
import prisma from "../database/prisma/client";
import { Prisma, Idea as PrismaIdea } from "@prisma/client";

function toEntity(raw: PrismaIdea): Idea {
  return new Idea({
    id: raw.id,
    title: raw.title,
    description: raw.description,
    authorId: raw.author_id,
    extraFields: raw.extra_fields as Record<string, unknown> | null,
    currentStage: raw.current_stage,
    status: raw.status,
    cancellation:
      raw.cancelled_at && raw.cancelled_by_id
        ? { at: raw.cancelled_at, byId: raw.cancelled_by_id, reason: raw.cancellation_reason ?? "" }
        : null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  });
}

export class PrismaIdeaRepository implements IIdeaRepository {
  async create(idea: Idea): Promise<Idea> {
    const raw = await prisma.idea.create({
      data: {
        ...(idea.id ? { id: idea.id } : {}),
        title: idea.title,
        description: idea.description,
        author_id: idea.authorId,
        extra_fields: (idea.extraFields ?? {}) as Prisma.InputJsonValue,
        status: idea.status,
      },
    });

    return toEntity(raw);
  }

  async findById(id: string): Promise<Idea | null> {
    const raw = await prisma.idea.findUnique({
      where: { id },
    });

    return raw ? toEntity(raw) : null;
  }

  async findAll(filters?: IdeaFilters): Promise<Idea[]> {
    const where: Prisma.IdeaWhereInput = {};

    if (filters?.stage) {
      if (!isIdeaStage(filters.stage)) {
        throw new Error(`Invalid idea stage filter: ${filters.stage}`);
      }
      where.current_stage = filters.stage;
    }

    if (filters?.status) {
      if (!isIdeaStatus(filters.status)) {
        throw new Error(`Invalid idea status filter: ${filters.status}`);
      }
      where.status = filters.status;
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

    return list.map(toEntity);
  }

  async update(id: string, data: UpdateIdeaData): Promise<Idea> {
    const raw = await prisma.idea.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.extraFields !== undefined
          ? {
              extra_fields: (data.extraFields ?? {}) as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    return toEntity(raw);
  }

  async cancel(id: string, cancellation: IdeaCancellation): Promise<Idea> {
    const raw = await prisma.idea.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelled_at: cancellation.at,
        cancelled_by_id: cancellation.byId,
        cancellation_reason: cancellation.reason,
      },
    });

    return toEntity(raw);
  }

  async updateProgress(id: string, data: IdeaProgressData): Promise<Idea> {
    const raw = await prisma.idea.update({
      where: { id },
      data: {
        ...(data.currentStage !== undefined ? { current_stage: data.currentStage } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });

    return toEntity(raw);
  }
}
