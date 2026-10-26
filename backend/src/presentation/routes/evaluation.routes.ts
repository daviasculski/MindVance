import { Router } from "express";
import { SubmitEvaluationUserStory } from "../../application/userstories/SubmitEvaluationUserStory";
import { GetEvaluationQueueUserStory } from "../../application/userstories/GetEvaluationQueueUserStory";
import { PrismaEvaluationRepository } from "../../infrastructure/repositories/PrismaEvaluationRepository";
import { PrismaIdeaRepository } from "../../infrastructure/repositories/PrismaIdeaRepository";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";
import { PrismaGateRepository } from "../../infrastructure/repositories/PrismaGateRepository";
import { PrismaGateReviewRepository } from "../../infrastructure/repositories/PrismaGateReviewRepository";
import { SubmitEvaluationController } from "../controllers/SubmitEvaluationController";
import { GetEvaluationQueueController } from "../controllers/GetEvaluationQueueController";
import { ensureRole } from "../middlewares/ensureRole";

const evaluationRoutes = Router();

// Injeção de dependências
const evaluationRepository = new PrismaEvaluationRepository();
const ideaRepository = new PrismaIdeaRepository();
const userRepository = new PrismaUserRepository();
const gateRepository = new PrismaGateRepository();
const gateReviewRepository = new PrismaGateReviewRepository();

const submitEvaluationController = new SubmitEvaluationController(
  new SubmitEvaluationUserStory(evaluationRepository, ideaRepository, gateRepository, gateReviewRepository),
);
const getEvaluationQueueController = new GetEvaluationQueueController(
  new GetEvaluationQueueUserStory(
    ideaRepository,
    evaluationRepository,
    userRepository,
    gateRepository,
    gateReviewRepository,
  ),
);

// Pareceres: só Avaliadores (a designação é conferida na UserStory)
evaluationRoutes.use(ensureRole("EVALUATOR"));
evaluationRoutes.post("/", (req, res) => submitEvaluationController.handle(req, res));
evaluationRoutes.get("/queue", (req, res) => getEvaluationQueueController.handle(req, res));

export { evaluationRoutes };
