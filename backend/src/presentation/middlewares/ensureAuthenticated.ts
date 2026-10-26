import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";

const userRepository = new PrismaUserRepository();

export async function ensureAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.headers.authorization;
  const authorizationParts = authorization?.trim().split(/\s+/) ?? [];
  const [scheme, token] = authorizationParts;

  if (
    authorizationParts.length !== 2 ||
    scheme.toLowerCase() !== "bearer" ||
    !token
  ) {
    res.status(401).json({ error: "Bearer token is required" });
    return;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is not configured");
    res.status(500).json({ error: "Authentication is not configured" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret);

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      payload.sub.length === 0
    ) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const user = await userRepository.findById(payload.sub);
    if (!user) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    // O papel vem do banco a cada requisição: aprovar, recusar ou trocar o papel
    // vale na hora. Sem aprovação, o usuário opera como Colaborador (P1).
    req.user = {
      id: payload.sub,
      role: user.effectiveRole,
    };
    next();
  } catch (error: unknown) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    console.error("Authentication failed:", error);
    res.status(500).json({ error: "Unable to verify authentication" });
  }
}
