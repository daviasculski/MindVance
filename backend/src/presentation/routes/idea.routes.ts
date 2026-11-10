import { Router } from "express";
import { IdeaController } from "../controllers/IdeaController";
import { ListIdeasController } from "../controllers/ListIdeasController";
import { GetIdeaByIdController } from "../controllers/GetIdeaByIdController";
import { UpdateIdeaController } from "../controllers/UpdateIdeaController";
import { CancelIdeaController } from "../controllers/CancelIdeaController";
import { CreateIdeaUserStorie } from "../../application/userstories/CreateIdeaUserStorie";
import { ListIdeasUserStory } from "../../application/userstories/ListIdeasUserStory";
import { GetIdeaByIdUserStory } from "../../application/userstories/GetIdeaByIdUserStory";
import { UpdateIdeaUserStory } from "../../application/userstories/UpdateIdeaUserStory";
import { CancelIdeaUserStory } from "../../application/userstories/CancelIdeaUserStory";
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
import { IdeaAttachmentsUserStory } from "../../application/userstories/IdeaAttachmentsUserStory";
import { PrismaAttachmentRepository } from "../../infrastructure/repositories/PrismaAttachmentRepository";
import { PrismaManualStageTransitionRepository } from "../../infrastructure/repositories/PrismaManualStageTransitionRepository";
import { MoveIdeaToNextStageUserStory } from "../../application/userstories/MoveIdeaToNextStageUserStory";
import { ListManualStageTransitionsUserStory } from "../../application/userstories/ListManualStageTransitionsUserStory";
import { ManualStageTransitionController } from "../controllers/ManualStageTransitionController";
import path from "path";
import {
  originalNameOf,
  removeUploadedFiles,
  uploadAttachments,
  uploadDir,
} from "../middlewares/uploadAttachments";

const ideaRoutes = Router();

// Injeção de dependências
const ideaRepository = new PrismaIdeaRepository();
const evaluationRepository = new PrismaEvaluationRepository();
const userRepository = new PrismaUserRepository();
const gateDecisionRepository = new PrismaGateDecisionRepository();
const gateRepository = new PrismaGateRepository();
const gateReviewRepository = new PrismaGateReviewRepository();
const manualStageTransitionRepository = new PrismaManualStageTransitionRepository();

const ideaController = new IdeaController(new CreateIdeaUserStorie(ideaRepository, notifier));
const listIdeaGateReviews = new ListIdeaGateReviewsUserStory(ideaRepository, gateRepository, gateReviewRepository);
const listIdeasController = new ListIdeasController(
  new ListIdeasUserStory(ideaRepository, userRepository),
);
const getIdeaByIdController = new GetIdeaByIdController(
  new GetIdeaByIdUserStory(ideaRepository, userRepository, gateReviewRepository),
);
const updateIdeaController = new UpdateIdeaController(
  new UpdateIdeaUserStory(ideaRepository),
);
const cancelIdeaController = new CancelIdeaController(
  new CancelIdeaUserStory(ideaRepository, gateReviewRepository, userRepository, notifier),
);
const getInnovationMetricsController = new GetInnovationMetricsController(
  new GetInnovationMetricsUserStory(
    ideaRepository,
    gateRepository,
    gateDecisionRepository,
    manualStageTransitionRepository,
  ),
);
const getFunnelUserStory = new GetFunnelUserStory(
  ideaRepository,
  userRepository,
  gateReviewRepository,
  gateDecisionRepository,
  manualStageTransitionRepository,
);
const manualStageTransitionController = new ManualStageTransitionController(
  new MoveIdeaToNextStageUserStory(ideaRepository, manualStageTransitionRepository),
  new ListManualStageTransitionsUserStory(manualStageTransitionRepository, userRepository),
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
const ideaAttachments = new IdeaAttachmentsUserStory(
  ideaRepository,
  gateReviewRepository,
  new PrismaAttachmentRepository(),
  userRepository,
);
const attachmentErrors = {
  "Ideia não encontrada": 404,
  "Attachment not found": 404,
  "You cannot view this idea": 403,
  "Only the author can attach files": 403,
  "Files can only be attached before triage, between gates or after revision": 409,
  "At least one file is required": 400,
};
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
// Painel do funil e avanço manual: Gestor de Inovação e Administrador
ideaRoutes.get("/funnel", ensureRole("GATEKEEPER", "ADMIN"), async (_req, res) => {
  try {
    return res.status(200).json(await getFunnelUserStory.execute());
  } catch (error) {
    return sendError(res, error, {}, "Unable to load funnel");
  }
});
ideaRoutes.patch(
  "/:id/stage",
  ensureRole("GATEKEEPER", "ADMIN"),
  (req, res) => manualStageTransitionController.move(req, res),
);
ideaRoutes.get(
  "/:id/stage-transitions",
  ensureRole("GATEKEEPER", "ADMIN"),
  (req, res) => manualStageTransitionController.list(req, res),
);
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
// Anexos da submissão e entregas dos estágios (SUB-02, ACO-04)
ideaRoutes.get("/:id/attachments", async (req, res) => {
  try {
    return res.status(200).json(await ideaAttachments.list(req.params.id, { id: req.user!.id, role: req.user!.role }));
  } catch (error) {
    return sendError(res, error, attachmentErrors, "Unable to list attachments");
  }
});
ideaRoutes.post("/:id/attachments", uploadAttachments, async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  try {
    const created = await ideaAttachments.upload(
      req.params.id,
      files.map((f) => ({ originalName: originalNameOf(f), storedName: f.filename, mimeType: f.mimetype, size: f.size })),
      { id: req.user!.id, role: req.user!.role },
    );
    return res.status(201).json(created);
  } catch (error) {
    removeUploadedFiles(req);
    return sendError(res, error, attachmentErrors, "Unable to upload attachments");
  }
});
ideaRoutes.get("/:id/attachments/:attachmentId/download", async (req, res) => {
  try {
    const attachment = await ideaAttachments.getForDownload(req.params.id, req.params.attachmentId, {
      id: req.user!.id,
      role: req.user!.role,
    });
    return res.download(path.join(uploadDir, attachment.storedName), attachment.fileName, (error) => {
      if (error && !res.headersSent) res.status(404).json({ error: "Attachment file not found" });
    });
  } catch (error) {
    return sendError(res, error, attachmentErrors, "Unable to download attachment");
  }
});
ideaRoutes.put("/:id", (req, res) => updateIdeaController.handle(req, res));
// Sem DELETE: ideias e seu histórico são imutáveis (P3)
ideaRoutes.patch("/:id/cancel", (req, res) => cancelIdeaController.handle(req, res));

export { ideaRoutes };
