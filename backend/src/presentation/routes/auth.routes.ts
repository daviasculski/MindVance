import { Router } from "express";
import { LoginUserStory } from "../../application/userstories/LoginUserStory";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";
import { LoginController } from "../controllers/LoginController";

const authRoutes = Router();

// Injeção de dependências
const userRepository = new PrismaUserRepository();
const loginUserStory = new LoginUserStory(userRepository);
const loginController = new LoginController(loginUserStory);

authRoutes.post("/login", (req, res) => loginController.handle(req, res));

export { authRoutes };
