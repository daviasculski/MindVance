import { Router } from "express";
import { CreateUserUserStory } from "../../application/userstories/CreateUserUserStory";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";
import { CreateUserController } from "../controllers/CreateUserController";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureAdminRole } from "../middlewares/ensureAdminRole";
import { ManageUserApprovalsUserStory } from "../../application/userstories/ManageUserApprovalsUserStory";
import { UserApprovalController } from "../controllers/UserApprovalController";
import { ManageUsersUserStory } from "../../application/userstories/ManageUsersUserStory";
import { ManageUsersController } from "../controllers/ManageUsersController";
import { ensureRole } from "../middlewares/ensureRole";

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
const manageUsersController = new ManageUsersController(new ManageUsersUserStory(userRepository));

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
userRoutes.patch(
  "/:id/approval",
  ensureAuthenticated,
  ensureAdminRole,
  (req, res) => userApprovalController.decide(req, res),
);
// Gestão de usuários pelo Administrador: lista e troca de papel (P1)
userRoutes.get("/", ensureAuthenticated, ensureAdminRole, (req, res) =>
  manageUsersController.list(req, res),
);
userRoutes.patch("/:id/role", ensureAuthenticated, ensureAdminRole, (req, res) =>
  manageUsersController.changeRole(req, res),
);
// Avaliadores aprovados, para o Gestor designar em um gate
userRoutes.get("/evaluators", ensureAuthenticated, ensureRole("GATEKEEPER"), (req, res) =>
  manageUsersController.evaluators(req, res),
);

export { userRoutes };
