import { Router } from "express";
import { CreateUserUserStory } from "../../application/userstories/CreateUserUserStory";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";
import { CreateUserController } from "../controllers/CreateUserController";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureAdminRole } from "../middlewares/ensureAdminRole";
import { ManageUserApprovalsUserStory } from "../../application/userstories/ManageUserApprovalsUserStory";
import { UserApprovalController } from "../controllers/UserApprovalController";

const userRoutes = Router();

// Injeção de dependências
const userRepository = new PrismaUserRepository();
const createUserUserStory = new CreateUserUserStory(userRepository);
const createUserController = new CreateUserController(createUserUserStory);
const createAdminUserController = new CreateUserController(
  createUserUserStory,
  true,
);
const userApprovalController = new UserApprovalController(
  new ManageUserApprovalsUserStory(userRepository),
);

userRoutes.post("/", (req, res) => createUserController.handle(req, res));
userRoutes.post(
  "/admin",
  ensureAuthenticated,
  ensureAdminRole,
  (req, res) => createAdminUserController.handle(req, res),
);
userRoutes.get(
  "/approvals/pending",
  ensureAuthenticated,
  ensureAdminRole,
  (req, res) => userApprovalController.listPending(req, res),
);
userRoutes.get(
  "/aprovals/pending",
  ensureAuthenticated,
  ensureAdminRole,
  (req, res) => userApprovalController.listPending(req, res),
);
userRoutes.patch(
  "/:id/approval",
  ensureAuthenticated,
  ensureAdminRole,
  (req, res) => userApprovalController.decide(req, res),
);

export { userRoutes };
