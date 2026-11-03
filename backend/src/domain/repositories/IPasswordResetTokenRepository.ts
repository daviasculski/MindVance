export interface IPasswordResetTokenRepository {
  createForUser(userId: string, token: string, expiresAt: Date): Promise<void>;
  consume(token: string, passwordHash: string): Promise<boolean>;
}
