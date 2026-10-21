import { NextFunction, Request, Response } from "express";

export function ensureGatekeeperRole(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.user?.role !== "GATEKEEPER") {
    res.status(403).json({ error: "Gatekeeper access required" });
    return;
  }

  next();
}
