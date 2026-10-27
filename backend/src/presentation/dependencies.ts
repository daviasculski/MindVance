import { Notifier } from "../application/services/Notifier";
import { PrismaNotificationRepository } from "../infrastructure/repositories/PrismaNotificationRepository";
import { PrismaUserRepository } from "../infrastructure/repositories/PrismaUserRepository";

/** Instância única do serviço de notificações, compartilhada pelas rotas. */
export const notifier = new Notifier(new PrismaNotificationRepository(), new PrismaUserRepository());
