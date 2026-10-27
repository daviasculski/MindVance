import { NewNotification, Notification } from "../entities/Notification";

export interface INotificationRepository {
  createForUsers(userIds: string[], notification: NewNotification): Promise<void>;
  /** Mais recentes primeiro */
  findByUser(userId: string, limit: number): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  /** Marca como lida só se a notificação for do usuário; retorna false se não encontrou */
  markRead(id: string, userId: string): Promise<boolean>;
  markAllRead(userId: string): Promise<void>;
}
