import { Router } from "express";
import { SubmitEvaluationUserStory } from "../../application/userstories/SubmitEvaluationUserStory";
import { PrismaEvaluationRepository } from "../../infrastructure/repositories/PrismaEvaluationRepository";
import { PrismaIdeaRepository } from "../../infrastructure/repositories/PrismaIdeaRepository";
import { SubmitEvaluationController } from "../controllers/SubmitEvaluationController";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";

const evaluationRoutes = Router();

// Injeção de dependências
const evaluationRepository = new PrismaEvaluationRepository();
const ideaRepository = new PrismaIdeaRepository();
const submitEvaluationUserStory = new SubmitEvaluationUserStory(
  evaluationRepository,
  ideaRepository,
);
const submitEvaluationController = new SubmitEvaluationController(
  submitEvaluationUserStory,
);

evaluationRoutes.post("/", ensureAuthenticated, (req, res) =>
  submitEvaluationController.handle(req, res),
);

export { evaluationRoutes };
