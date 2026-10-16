import { UserRole } from "../../domain/entities/UserRole";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: UserRole;
      };
    }
  }
}

export {};
