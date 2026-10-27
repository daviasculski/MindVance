import { NewNotification, Notification, NotificationType } from "../../domain/entities/Notification";
import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import prisma from "../database/prisma/client";

export class PrismaNotificationRepository implements INotificationRepository {
  async createForUsers(userIds: string[], notification: NewNotification): Promise<void> {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return;
    await prisma.notification.createMany({
      data: unique.map((userId) => ({
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        ideaId: notification.ideaId ?? null,
        link: notification.link ?? null,
      })),
    });
  }

  async findByUser(userId: string, limit: number): Promise<Notification[]> {
    const list = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return list.map((n) => ({ ...n, type: n.type as NotificationType }));
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(id: string, userId: string): Promise<boolean> {
    const result = await prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count > 0) return true;
    // Já lida também conta como sucesso; só falha se não existe para este usuário
    return (await prisma.notification.count({ where: { id, userId } })) > 0;
  }

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
