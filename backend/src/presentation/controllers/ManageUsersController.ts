import { Request, Response } from "express";
import { ManageUsersUserStory } from "../../application/userstories/ManageUsersUserStory";
import { sendError } from "../http";

const statusByMessage: Record<string, number> = {
  "Invalid user role": 400,
  "Administrators cannot change their own role": 403,
  "User not found": 404,
};

export class ManageUsersController {
  constructor(private readonly manageUsers: ManageUsersUserStory) {}

  async list(_req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json(await this.manageUsers.listAll());
    } catch (error) {
      return sendError(res, error, statusByMessage, "Unable to list users");
    }
  }

  async changeRole(req: Request, res: Response): Promise<Response> {
    try {
      const user = await this.manageUsers.changeRole(req.params.id, req.body?.role, {
        id: req.user!.id,
        role: req.user!.role,
      });
      return res.status(200).json(user);
    } catch (error) {
      return sendError(res, error, statusByMessage, "Unable to change user role");
    }
  }

  async evaluators(_req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json(await this.manageUsers.listEvaluators());
    } catch (error) {
      return sendError(res, error, statusByMessage, "Unable to list evaluators");
    }
  }
}
