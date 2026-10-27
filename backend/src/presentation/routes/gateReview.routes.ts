import { Router } from "express";
import { AssignEvaluatorsUserStory } from "../../application/userstories/AssignEvaluatorsUserStory";
import { DecideGateUserStory } from "../../application/userstories/DecideGateUserStory";
import { GateReviewQueriesUserStory } from "../../application/userstories/GateReviewQueriesUserStory";
import { OpenGateReviewUserStory } from "../../application/userstories/OpenGateReviewUserStory";
import { PrismaEvaluationRepository } from "../../infrastructure/repositories/PrismaEvaluationRepository";
import { PrismaGateDecisionRepository } from "../../infrastructure/repositories/PrismaGateDecisionRepository";
import { PrismaGateRepository } from "../../infrastructure/repositories/PrismaGateRepository";
import { PrismaGateReviewRepository } from "../../infrastructure/repositories/PrismaGateReviewRepository";
import { PrismaIdeaRepository } from "../../infrastructure/repositories/PrismaIdeaRepository";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";
import { GateReviewController } from "../controllers/GateReviewController";
import { ensureRole } from "../middlewares/ensureRole";
import { notifier } from "../dependencies";

// Injeção de dependências
const ideaRepository = new PrismaIdeaRepository();
const gateRepository = new PrismaGateRepository();
const gateReviewRepository = new PrismaGateReviewRepository();
const evaluationRepository = new PrismaEvaluationRepository();
const userRepository = new PrismaUserRepository();
const gateDecisionRepository = new PrismaGateDecisionRepository();

export const gateReviewController = new GateReviewController(
  new OpenGateReviewUserStory(ideaRepository, gateRepository, gateReviewRepository, notifier),
  new AssignEvaluatorsUserStory(ideaRepository, gateRepository, gateReviewRepository, userRepository, notifier),
  new DecideGateUserStory(ideaRepository, gateRepository, gateReviewRepository, gateDecisionRepository, notifier),
  new GateReviewQueriesUserStory(
    ideaRepository,
    gateRepository,
    gateReviewRepository,
    evaluationRepository,
    userRepository,
  ),
);

/** Rodadas de gate: filas, designação e decisão. Só o Gestor de Inovação (D2, D3, D4). */
const gateReviewRoutes = Router();
gateReviewRoutes.use(ensureRole("GATEKEEPER"));
gateReviewRoutes.get("/", (req, res) => gateReviewController.list(req, res));
gateReviewRoutes.get("/:id", (req, res) => gateReviewController.detail(req, res));
gateReviewRoutes.post("/:id/evaluators", (req, res) => gateReviewController.assign(req, res));
gateReviewRoutes.post("/:id/decision", (req, res) => gateReviewController.decide(req, res));

/** Configuração dos gates (critérios, pesos, limites): leitura para qualquer usuário logado */
const gateRoutes = Router();
gateRoutes.get("/", (req, res) => gateReviewController.gates(req, res));

export { gateReviewRoutes, gateRoutes };
