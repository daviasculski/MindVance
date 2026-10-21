import { NextFunction, Request, Response } from "express";

export function ensureManagementRole(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (
    req.user?.role !== "ADMIN" &&
    req.user?.role !== "EVALUATOR" &&
    req.user?.role !== "GESTOR_INOVACAO"
  ) {
    res.status(403).json({ error: "Management access required" });
    return;
  }

  next();
}
