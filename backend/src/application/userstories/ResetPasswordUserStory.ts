import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { IPasswordResetTokenRepository } from "../../domain/repositories/IPasswordResetTokenRepository";

const PASSWORD_MIN_LENGTH = 8;

export class ResetPasswordUserStory {
  constructor(private readonly resetTokenRepository: IPasswordResetTokenRepository) {}

  async execute(tokenInput: unknown, passwordInput: unknown): Promise<void> {
    if (typeof tokenInput !== "string" || tokenInput.length === 0) {
      throw new Error("A valid reset token is required");
    }
    if (typeof passwordInput !== "string" || passwordInput.length < PASSWORD_MIN_LENGTH) {
      throw new Error(`Password must have at least ${PASSWORD_MIN_LENGTH} characters`);
    }

    const tokenHash = createHash("sha256").update(tokenInput).digest("hex");
    const passwordHash = await bcrypt.hash(passwordInput, 10);
    if (!(await this.resetTokenRepository.consume(tokenHash, passwordHash))) {
      throw new Error("Reset token is invalid or expired");
    }
  }
}
