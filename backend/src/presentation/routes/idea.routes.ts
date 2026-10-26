import { Router } from "express";
import { IdeaController } from "../controllers/IdeaController";
import { ListIdeasController } from "../controllers/ListIdeasController";
import { GetIdeaByIdController } from "../controllers/GetIdeaByIdController";
import { UpdateIdeaController } from "../controllers/UpdateIdeaController";
import { CreateIdeaUserStorie } from "../../application/userstories/CreateIdeaUserStorie";
import { ListIdeasUserStory } from "../../application/userstories/ListIdeasUserStory";
import { GetIdeaByIdUserStory } from "../../application/userstories/GetIdeaByIdUserStory";
import { UpdateIdeaUserStory } from "../../application/userstories/UpdateIdeaUserStory";
import { PrismaIdeaRepository } from "../../infrastructure/repositories/PrismaIdeaRepository";
import { PrismaEvaluationRepository } from "../../infrastructure/repositories/PrismaEvaluationRepository";
import { ensureRole } from "../middlewares/ensureRole";
import { GetInnovationMetricsUserStory } from "../../application/userstories/GetInnovationMetricsUserStory";
import { GetInnovationMetricsController } from "../controllers/GetInnovationMetricsController";
import { ListIdeaEvaluationsUserStory } from "../../application/userstories/ListIdeaEvaluationsUserStory";
import { ListIdeaEvaluationsController } from "../controllers/ListIdeaEvaluationsController";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";
import { PrismaGateDecisionRepository } from "../../infrastructure/repositories/PrismaGateDecisionRepository";
import { PrismaGateRepository } from "../../infrastructure/repositories/PrismaGateRepository";
import { PrismaGateReviewRepository } from "../../infrastructure/repositories/PrismaGateReviewRepository";
import { ListGateDecisionsUserStory } from "../../application/userstories/ListGateDecisionsUserStory";
import { GateDecisionController } from "../controllers/GateDecisionController";
import { gateReviewController } from "./gateReview.routes";

const ideaRoutes = Router();

// Injeção de dependências
const ideaRepository = new PrismaIdeaRepository();
const evaluationRepository = new PrismaEvaluationRepository();
const userRepository = new PrismaUserRepository();
const gateDecisionRepository = new PrismaGateDecisionRepository();
const gateRepository = new PrismaGateRepository();
const gateReviewRepository = new PrismaGateReviewRepository();

const ideaController = new IdeaController(new CreateIdeaUserStorie(ideaRepository));
const listIdeasController = new ListIdeasController(
  new ListIdeasUserStory(ideaRepository, userRepository),
);
const getIdeaByIdController = new GetIdeaByIdController(
  new GetIdeaByIdUserStory(ideaRepository, userRepository),
);
const updateIdeaController = new UpdateIdeaController(new UpdateIdeaUserStory(ideaRepository));
const getInnovationMetricsController = new GetInnovationMetricsController(
  new GetInnovationMetricsUserStory(ideaRepository),
);
const gateDecisionController = new GateDecisionController(
  new ListGateDecisionsUserStory(
    ideaRepository,
    gateDecisionRepository,
    userRepository,
    gateRepository,
    gateReviewRepository,
  ),
);
const listIdeaEvaluationsController = new ListIdeaEvaluationsController(
  new ListIdeaEvaluationsUserStory(
    ideaRepository,
    evaluationRepository,
    userRepository,
    gateRepository,
    gateReviewRepository,
  ),
);

// Todas exigem autenticação (aplicada em routes/index.ts)
ideaRoutes.post("/", (req, res) => ideaController.create(req, res));
ideaRoutes.get("/", (req, res) => listIdeasController.handle(req, res));
// KPIs: Gestor de Inovação e Administrador, só leitura (P3)
ideaRoutes.get("/metrics", ensureRole("GATEKEEPER", "ADMIN"), (req, res) =>
  getInnovationMetricsController.handle(req, res),
);
ideaRoutes.get("/:id", (req, res) => getIdeaByIdController.handle(req, res));
ideaRoutes.get("/:id/evaluations", (req, res) => listIdeaEvaluationsController.handle(req, res));
ideaRoutes.get("/:id/gate-decisions", (req, res) => gateDecisionController.list(req, res));
// Abre uma rodada: Gestor na triagem (G1) ou autor solicitando revisão do gate
ideaRoutes.post("/:id/gate-reviews", (req, res) => gateReviewController.open(req, res));
ideaRoutes.put("/:id", (req, res) => updateIdeaController.handle(req, res));
// Sem DELETE: ideias e seu histórico são imutáveis (P3)

export { ideaRoutes };
