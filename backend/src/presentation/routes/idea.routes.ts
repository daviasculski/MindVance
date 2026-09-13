import { Router } from "express";
import { IdeaController } from "../controllers/IdeaController";
import { ListIdeasController } from "../controllers/ListIdeasController";
import { CreateIdeaUserStorie } from "../../application/userstories/CreateIdeaUserStorie";
import { ListIdeasUserStory } from "../../application/userstories/ListIdeasUserStory";
import { PrismaIdeaRepository } from "../../infrastructure/repositories/PrismaIdeaRepository";

const ideaRoutes = Router();

// Injeção de dependências
const ideaRepository = new PrismaIdeaRepository();

const createIdeaUserStory = new CreateIdeaUserStorie(ideaRepository);
const ideaController = new IdeaController(createIdeaUserStory);

const listIdeasUserStory = new ListIdeasUserStory(ideaRepository);
const listIdeasController = new ListIdeasController(listIdeasUserStory);

ideaRoutes.post("/", (req, res) => ideaController.create(req, res));
ideaRoutes.get("/", (req, res) => listIdeasController.handle(req, res));

export { ideaRoutes };
