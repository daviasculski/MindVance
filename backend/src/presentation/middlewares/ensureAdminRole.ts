import { NextFunction, Request, Response } from "express";

export function ensureAdminRole(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
}
