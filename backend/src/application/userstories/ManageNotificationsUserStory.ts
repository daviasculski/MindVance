import { Notification } from "../../domain/entities/Notification";
import { INotificationRepository } from "../../domain/repositories/INotificationRepository";

const LIST_LIMIT = 50;

/** Notificações do usuário logado (NOT-01): lista, não lidas e marcar como lida. */
export class ManageNotificationsUserStory {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async list(userId: string): Promise<{ unreadCount: number; items: Notification[] }> {
    const [items, unreadCount] = await Promise.all([
      this.notificationRepository.findByUser(userId, LIST_LIMIT),
      this.notificationRepository.countUnread(userId),
    ]);
    return { unreadCount, items };
  }

  async markRead(id: string, userId: string): Promise<void> {
    if (!(await this.notificationRepository.markRead(id, userId))) {
      throw new Error("Notification not found");
    }
  }

  markAllRead(userId: string): Promise<void> {
    return this.notificationRepository.markAllRead(userId);
  }
}
