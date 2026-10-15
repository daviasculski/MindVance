import { Router } from "express";
import { IdeaController } from "../controllers/IdeaController";
import { ListIdeasController } from "../controllers/ListIdeasController";
import { GetIdeaByIdController } from "../controllers/GetIdeaByIdController";
import { UpdateIdeaController } from "../controllers/UpdateIdeaController";
import { DeleteIdeaController } from "../controllers/DeleteIdeaController";
import { CreateIdeaUserStorie } from "../../application/userstories/CreateIdeaUserStorie";
import { ListIdeasUserStory } from "../../application/userstories/ListIdeasUserStory";
import { GetIdeaByIdUserStory } from "../../application/userstories/GetIdeaByIdUserStory";
import { UpdateIdeaUserStory } from "../../application/userstories/UpdateIdeaUserStory";
import { DeleteIdeaUserStory } from "../../application/userstories/DeleteIdeaUserStory";
import { PrismaIdeaRepository } from "../../infrastructure/repositories/PrismaIdeaRepository";
import { PrismaEvaluationRepository } from "../../infrastructure/repositories/PrismaEvaluationRepository";
import { AdvanceIdeaStageUserStory } from "../../application/userstories/AdvanceIdeaStageUserStory";
import { AdvanceIdeaStageController } from "../controllers/AdvanceIdeaStageController";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureManagementRole } from "../middlewares/ensureManagementRole";
import { GetInnovationMetricsUserStory } from "../../application/userstories/GetInnovationMetricsUserStory";
import { GetInnovationMetricsController } from "../controllers/GetInnovationMetricsController";
import { ListIdeaEvaluationsUserStory } from "../../application/userstories/ListIdeaEvaluationsUserStory";
import { ListIdeaEvaluationsController } from "../controllers/ListIdeaEvaluationsController";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";

const ideaRoutes = Router();

// Injeção de dependências
const ideaRepository = new PrismaIdeaRepository();
const evaluationRepository = new PrismaEvaluationRepository();

const createIdeaUserStory = new CreateIdeaUserStorie(ideaRepository);
const ideaController = new IdeaController(createIdeaUserStory);

const listIdeasUserStory = new ListIdeasUserStory(ideaRepository);
const listIdeasController = new ListIdeasController(listIdeasUserStory);

const getIdeaByIdUserStory = new GetIdeaByIdUserStory(ideaRepository);
const getIdeaByIdController = new GetIdeaByIdController(getIdeaByIdUserStory);

const updateIdeaUserStory = new UpdateIdeaUserStory(ideaRepository);
const updateIdeaController = new UpdateIdeaController(updateIdeaUserStory);

const deleteIdeaUserStory = new DeleteIdeaUserStory(ideaRepository);
const deleteIdeaController = new DeleteIdeaController(deleteIdeaUserStory);

const advanceIdeaStageUserStory = new AdvanceIdeaStageUserStory(
  ideaRepository,
  evaluationRepository,
);
const advanceIdeaStageController = new AdvanceIdeaStageController(
  advanceIdeaStageUserStory,
);

const getInnovationMetricsUserStory = new GetInnovationMetricsUserStory(
  ideaRepository,
);
const getInnovationMetricsController = new GetInnovationMetricsController(
  getInnovationMetricsUserStory,
);

const userRepository = new PrismaUserRepository();
const listIdeaEvaluationsUserStory = new ListIdeaEvaluationsUserStory(
  ideaRepository,
  evaluationRepository,
  userRepository,
);
const listIdeaEvaluationsController = new ListIdeaEvaluationsController(
  listIdeaEvaluationsUserStory,
);

//rotas do projeto
//testadas no postman
ideaRoutes.post("/", (req, res) => ideaController.create(req, res));
ideaRoutes.get("/", (req, res) => listIdeasController.handle(req, res));
ideaRoutes.get(
  "/metrics",
  ensureAuthenticated,
  ensureManagementRole,
  (req, res) => getInnovationMetricsController.handle(req, res),
);
ideaRoutes.get("/:id", (req, res) => getIdeaByIdController.handle(req, res));
ideaRoutes.get("/:id/evaluations", (req, res) =>
  listIdeaEvaluationsController.handle(req, res),
);
ideaRoutes.put("/:id", (req, res) => updateIdeaController.handle(req, res));
ideaRoutes.delete("/:id", (req, res) => deleteIdeaController.handle(req, res));
ideaRoutes.patch("/:id/stage", ensureAuthenticated, (req, res) =>
  advanceIdeaStageController.handle(req, res),
);

export { ideaRoutes };
