import { NextFunction, Request, Response } from "express";

export function ensureInnovationManagerRole(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.user?.role !== "GESTOR_INOVACAO") {
    res.status(403).json({ error: "Innovation manager access required" });
    return;
  }

  next();
}
