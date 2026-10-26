import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { ideaRoutes } from "./idea.routes";
import { evaluationRoutes } from "./evaluation.routes";
import { userRoutes } from "./user.routes";
import { gateReviewRoutes, gateRoutes } from "./gateReview.routes";
import prisma from "../../infrastructure/database/prisma/client";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated"; // Importa o middleware

const routes = Router();

routes.get("/health", (req, res) => {
  return res
    .status(200)
    .json({ status: "ok", timestamp: new Date().toISOString() });
});

routes.get("/health/db", async (req, res) => {
  try {
    const result = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW()`;
    return res.status(200).json({ status: "ok", dbTime: result[0].now });
  } catch (error) {
    console.error("Database connection failed:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Database connection failed." });
  }
});

// Rotas públicas (não exigem token)
routes.use("/auth", authRoutes);
routes.use("/users", userRoutes);

// A partir daqui, QUALQUER rota registada abaixo exigirá obrigatoriamente o Token JWT
routes.use(ensureAuthenticated);

routes.use("/ideas", ideaRoutes);
routes.use("/evaluations", evaluationRoutes);
routes.use("/gate-reviews", gateReviewRoutes);
routes.use("/gates", gateRoutes);

export { routes };