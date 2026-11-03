import { createHash, randomBytes } from "crypto";
import { IEmailService } from "../services/IEmailService";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IPasswordResetTokenRepository } from "../../domain/repositories/IPasswordResetTokenRepository";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const SUCCESS_MESSAGE = "Instruções para redefinição de senha enviadas com sucesso para o seu e-mail!";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export class ForgotPasswordUserStory {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly resetTokenRepository: IPasswordResetTokenRepository,
    private readonly emailService: IEmailService,
  ) {}

  async execute(emailInput: unknown): Promise<{ message: string }> {
    if (typeof emailInput !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
      throw new Error("A valid email is required");
    }

    const user = await this.userRepository.findByEmail(emailInput.trim().toLowerCase());
    if (!user) throw new Error("E-mail não cadastrado no sistema.");

    const resetToken = randomBytes(32).toString("hex");
    await this.resetTokenRepository.createForUser(
      user.id,
      hashToken(resetToken),
      new Date(Date.now() + RESET_TOKEN_TTL_MS),
    );
    void this.emailService
      .sendPasswordResetEmail(user.email, resetToken)
      .catch((error: unknown) => console.error("Password reset email delivery failed:", error));

    return { message: SUCCESS_MESSAGE };
  }
}
