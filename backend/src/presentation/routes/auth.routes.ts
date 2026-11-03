import { Router } from "express";
import { LoginUserStory } from "../../application/userstories/LoginUserStory";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";
import { LoginController } from "../controllers/LoginController";
import { ForgotPasswordUserStory } from "../../application/userstories/ForgotPasswordUserStory";
import { ResetPasswordUserStory } from "../../application/userstories/ResetPasswordUserStory";
import { PrismaPasswordResetTokenRepository } from "../../infrastructure/repositories/PrismaPasswordResetTokenRepository";
import { PasswordResetController } from "../controllers/PasswordResetController";
import { emailService } from "../dependencies";

const authRoutes = Router();

// Injeção de dependências
const userRepository = new PrismaUserRepository();
const loginUserStory = new LoginUserStory(userRepository);
const loginController = new LoginController(loginUserStory);
const resetTokenRepository = new PrismaPasswordResetTokenRepository();
const passwordResetController = new PasswordResetController(
  new ForgotPasswordUserStory(userRepository, resetTokenRepository, emailService),
  new ResetPasswordUserStory(resetTokenRepository),
);

authRoutes.post("/login", (req, res) => loginController.handle(req, res));
authRoutes.post("/forgot-password", (req, res) => passwordResetController.forgot(req, res));
authRoutes.post("/reset-password", (req, res) => passwordResetController.reset(req, res));

export { authRoutes };
