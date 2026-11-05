import { Attachment as PrismaAttachment } from "@prisma/client";
import { Attachment, NewAttachment } from "../../domain/entities/Attachment";
import { IdeaStage } from "../../domain/entities/IdeaStage";
import { IAttachmentRepository } from "../../domain/repositories/IAttachmentRepository";
import prisma from "../database/prisma/client";

function toEntity(raw: PrismaAttachment): Attachment {
  return { ...raw, stage: raw.stage as IdeaStage };
}

export class PrismaAttachmentRepository implements IAttachmentRepository {
  async createMany(attachments: NewAttachment[]): Promise<Attachment[]> {
    const created = await prisma.$transaction(
      attachments.map((data) => prisma.attachment.create({ data })),
    );
    return created.map(toEntity);
  }

  async findByIdea(ideaId: string): Promise<Attachment[]> {
    const list = await prisma.attachment.findMany({
      where: { ideaId },
      orderBy: { createdAt: "asc" },
    });
    return list.map(toEntity);
  }

  async findById(id: string): Promise<Attachment | null> {
    const raw = await prisma.attachment.findUnique({ where: { id } });
    return raw ? toEntity(raw) : null;
  }
}
