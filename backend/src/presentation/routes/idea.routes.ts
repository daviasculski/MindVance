import { Router } from "express";
import { IdeaController } from "../controllers/IdeaController";
import { CreateIdeaUseCase } from "../../application/use-cases/CreateIdeaUseCase";
import { PrismaIdeaRepository } from "../../infrastructure/repositories/PrismaIdeaRepository";

const ideaRoutes = Router();

// Injeção de dependências
const ideaRepository = new PrismaIdeaRepository();
const createIdeaUseCase = new CreateIdeaUseCase(ideaRepository);
const ideaController = new IdeaController(createIdeaUseCase);

ideaRoutes.post("/", (req, res) => ideaController.create(req, res));

export { ideaRoutes };
