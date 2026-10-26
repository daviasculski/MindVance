import { NextFunction, Request, Response } from "express";
import { UserRole } from "../../domain/entities/UserRole";

/** Permite a rota só para os papéis informados (usa o papel efetivo do usuário). */
export function ensureRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Access denied for your role" });
      return;
    }
    next();
  };
}
