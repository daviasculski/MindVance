import prisma from "../database/prisma/client";
import { IPasswordResetTokenRepository } from "../../domain/repositories/IPasswordResetTokenRepository";

export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  async createForUser(userId: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId } }),
      prisma.passwordResetToken.create({ data: { userId, token, expiresAt } }),
    ]);
  }

  async consume(token: string, passwordHash: string): Promise<boolean> {
    return prisma.$transaction(async (transaction) => {
      const reset = await transaction.passwordResetToken.findUnique({ where: { token } });
      if (!reset || reset.expiresAt.getTime() <= Date.now()) return false;

      const consumed = await transaction.passwordResetToken.deleteMany({
        where: { id: reset.id, expiresAt: { gt: new Date() } },
      });
      if (consumed.count !== 1) return false;

      await transaction.user.update({
        where: { id: reset.userId },
        data: { password: passwordHash },
      });
      await transaction.passwordResetToken.deleteMany({ where: { userId: reset.userId } });
      return true;
    });
  }
}
