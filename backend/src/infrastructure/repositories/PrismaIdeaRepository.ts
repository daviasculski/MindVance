import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { Idea } from "../../domain/entities/Idea";
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
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  async findAll(): Promise<Idea[]> {
    const list = await prisma.idea.findMany({
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
          createdAt: raw.created_at,
          updatedAt: raw.updated_at,
        }),
    );
  }
}
