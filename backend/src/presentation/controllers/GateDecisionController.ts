import { Request, Response } from "express";
import { ListGateDecisionsUserStory } from "../../application/userstories/ListGateDecisionsUserStory";
import { sendError } from "../http";

const statusByMessage: Record<string, number> = {
  "Only the idea author can view its gate decisions": 403,
  "Idea not found": 404,
};

/** Histórico de decisões (transições) de uma ideia. A decisão em si é feita na rodada. */
export class GateDecisionController {
  constructor(private readonly listGateDecisionsUserStory: ListGateDecisionsUserStory) {}

  async list(req: Request, res: Response): Promise<Response> {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication is required" });
    }

    try {
      const decisions = await this.listGateDecisionsUserStory.execute({
        ideaId: req.params.id,
        requesterId: req.user.id,
        requesterRole: req.user.role,
      });
      return res.status(200).json(decisions);
    } catch (error) {
      return sendError(res, error, statusByMessage, "Unable to list gate decisions");
    }
  }
}
