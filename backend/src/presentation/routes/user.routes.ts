import { Router } from "express";
import { CreateUserUserStory } from "../../application/userstories/CreateUserUserStory";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";
import { CreateUserController } from "../controllers/CreateUserController";

const userRoutes = Router();

// Injeção de dependências
const userRepository = new PrismaUserRepository();
const createUserUserStory = new CreateUserUserStory(userRepository);
const createUserController = new CreateUserController(createUserUserStory);

userRoutes.post("/", (req, res) => createUserController.handle(req, res));

export { userRoutes };
