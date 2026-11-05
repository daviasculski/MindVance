import { Attachment, NewAttachment } from "../entities/Attachment";

export interface IAttachmentRepository {
  createMany(attachments: NewAttachment[]): Promise<Attachment[]>;
  findByIdea(ideaId: string): Promise<Attachment[]>;
  findById(id: string): Promise<Attachment | null>;
}
