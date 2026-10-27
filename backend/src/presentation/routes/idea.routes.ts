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
import { GetFunnelUserStory } from "../../application/userstories/GetFunnelUserStory";
import { sendError } from "../http";
import { notifier } from "../dependencies";
import { ListIdeaGateReviewsUserStory } from "../../application/userstories/ListIdeaGateReviewsUserStory";

const ideaRoutes = Router();

// Injeção de dependências
const ideaRepository = new PrismaIdeaRepository();
const evaluationRepository = new PrismaEvaluationRepository();
const userRepository = new PrismaUserRepository();
const gateDecisionRepository = new PrismaGateDecisionRepository();
const gateRepository = new PrismaGateRepository();
const gateReviewRepository = new PrismaGateReviewRepository();

const ideaController = new IdeaController(new CreateIdeaUserStorie(ideaRepository, notifier));
const listIdeaGateReviews = new ListIdeaGateReviewsUserStory(ideaRepository, gateRepository, gateReviewRepository);
const listIdeasController = new ListIdeasController(
  new ListIdeasUserStory(ideaRepository, userRepository),
);
const getIdeaByIdController = new GetIdeaByIdController(
  new GetIdeaByIdUserStory(ideaRepository, userRepository, gateReviewRepository),
);
const updateIdeaController = new UpdateIdeaController(new UpdateIdeaUserStory(ideaRepository));
const getInnovationMetricsController = new GetInnovationMetricsController(
  new GetInnovationMetricsUserStory(ideaRepository, gateRepository, gateDecisionRepository),
);
const getFunnelUserStory = new GetFunnelUserStory(
  ideaRepository,
  userRepository,
  gateReviewRepository,
  gateDecisionRepository,
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
// Painel do funil: só o Gestor de Inovação (FUN-04)
ideaRoutes.get("/funnel", ensureRole("GATEKEEPER"), async (_req, res) => {
  try {
    return res.status(200).json(await getFunnelUserStory.execute());
  } catch (error) {
    return sendError(res, error, {}, "Unable to load funnel");
  }
});
ideaRoutes.get("/:id", (req, res) => getIdeaByIdController.handle(req, res));
ideaRoutes.get("/:id/evaluations", (req, res) => listIdeaEvaluationsController.handle(req, res));
ideaRoutes.get("/:id/gate-decisions", (req, res) => gateDecisionController.list(req, res));
// Rodadas da ideia para o histórico (abertura do gate e atraso registrado)
ideaRoutes.get("/:id/gate-reviews", async (req, res) => {
  try {
    return res.status(200).json(
      await listIdeaGateReviews.execute(req.params.id, { id: req.user!.id, role: req.user!.role }),
    );
  } catch (error) {
    return sendError(
      res,
      error,
      { "Idea not found": 404, "Only the idea author can view its gate reviews": 403 },
      "Unable to list gate reviews",
    );
  }
});
// Abre uma rodada: Gestor na triagem (G1) ou autor solicitando revisão do gate
ideaRoutes.post("/:id/gate-reviews", (req, res) => gateReviewController.open(req, res));
ideaRoutes.put("/:id", (req, res) => updateIdeaController.handle(req, res));
// Sem DELETE: ideias e seu histórico são imutáveis (P3)

export { ideaRoutes };
