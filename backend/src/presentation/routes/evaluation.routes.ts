import { Router } from "express";
import { SubmitEvaluationUserStory } from "../../application/userstories/SubmitEvaluationUserStory";
import { PrismaEvaluationRepository } from "../../infrastructure/repositories/PrismaEvaluationRepository";
import { SubmitEvaluationController } from "../controllers/SubmitEvaluationController";

const evaluationRoutes = Router();

// Injeção de dependências
const evaluationRepository = new PrismaEvaluationRepository();
const submitEvaluationUserStory = new SubmitEvaluationUserStory(
  evaluationRepository,
);
const submitEvaluationController = new SubmitEvaluationController(
  submitEvaluationUserStory,
);

evaluationRoutes.post("/", (req, res) =>
  submitEvaluationController.handle(req, res),
);

export { evaluationRoutes };
