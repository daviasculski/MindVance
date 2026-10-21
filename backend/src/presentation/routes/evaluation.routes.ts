import { Router } from "express";
import { SubmitEvaluationUserStory } from "../../application/userstories/SubmitEvaluationUserStory";
import { GetEvaluationQueueUserStory } from "../../application/userstories/GetEvaluationQueueUserStory";
import { PrismaEvaluationRepository } from "../../infrastructure/repositories/PrismaEvaluationRepository";
import { PrismaIdeaRepository } from "../../infrastructure/repositories/PrismaIdeaRepository";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";
import { SubmitEvaluationController } from "../controllers/SubmitEvaluationController";
import { GetEvaluationQueueController } from "../controllers/GetEvaluationQueueController";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";

const evaluationRoutes = Router();

// Injeção de dependências
const evaluationRepository = new PrismaEvaluationRepository();
const ideaRepository = new PrismaIdeaRepository();
const userRepository = new PrismaUserRepository();
const submitEvaluationUserStory = new SubmitEvaluationUserStory(
  evaluationRepository,
  ideaRepository,
);
const submitEvaluationController = new SubmitEvaluationController(
  submitEvaluationUserStory,
);
const getEvaluationQueueUserStory = new GetEvaluationQueueUserStory(
  ideaRepository,
  evaluationRepository,
  userRepository,
);
const getEvaluationQueueController = new GetEvaluationQueueController(
  getEvaluationQueueUserStory,
);

evaluationRoutes.post("/", ensureAuthenticated, (req, res) =>
  submitEvaluationController.handle(req, res),
);
evaluationRoutes.get("/queue", ensureAuthenticated, (req, res) =>
  getEvaluationQueueController.handle(req, res),
);

export { evaluationRoutes };
