import { Notifier } from "../application/services/Notifier";
import { PrismaNotificationRepository } from "../infrastructure/repositories/PrismaNotificationRepository";
import { PrismaUserRepository } from "../infrastructure/repositories/PrismaUserRepository";
import { EmailService } from "../infrastructure/services/EmailService";

/** Instância única do serviço de notificações, compartilhada pelas rotas. */
export const emailService = new EmailService();
export const notifier = new Notifier(
  new PrismaNotificationRepository(),
  new PrismaUserRepository(),
  emailService,
);
