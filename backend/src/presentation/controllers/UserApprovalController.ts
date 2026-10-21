import { Request, Response } from "express";
import { ManageUserApprovalsUserStory } from "../../application/userstories/ManageUserApprovalsUserStory";

export class UserApprovalController {
  constructor(
    private readonly manageUserApprovalsUserStory: ManageUserApprovalsUserStory,
  ) {}

  async listPending(_req: Request, res: Response): Promise<Response> {
    try {
      const users = await this.manageUserApprovalsUserStory.listPending();
      return res.status(200).json(users);
    } catch (error: unknown) {
      console.error("Listing pending user approvals failed:", error);
      return res.status(500).json({ error: "Unable to list pending approvals" });
    }
  }

  async decide(req: Request, res: Response): Promise<Response> {
    try {
      const user = await this.manageUserApprovalsUserStory.decide(
        req.params.id,
        req.body?.status,
      );
      return res.status(200).json(user);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unexpected error";
      if (message === "Approval status must be APPROVED or REJECTED") {
        return res.status(400).json({ error: message });
      }
      if (message === "User not found") {
        return res.status(404).json({ error: message });
      }
      if (message === "User does not have a pending approval request") {
        return res.status(409).json({ error: message });
      }
      console.error("Updating user approval failed:", error);
      return res.status(500).json({ error: "Unable to update user approval" });
    }
  }
}
