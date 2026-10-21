import { Request, Response } from "express";
import { DecideGateUserStory } from "../../application/userstories/DecideGateUserStory";
import { ListGateDecisionsUserStory } from "../../application/userstories/ListGateDecisionsUserStory";

const statusByMessage: Record<string, number> = {
  "Only gatekeepers can decide gates": 403,
  "Only the idea author can view its gate decisions": 403,
  "Idea not found": 404,
  "Idea is not awaiting a gate decision": 409,
  "Cannot approve an idea without evaluations in the current stage": 409,
  "Decision must be APROVADA, REJEITADA or REVISAO": 400,
  "Feedback is required to decide a gate": 400,
  "Review points must be a list of texts": 400,
};

export class GateDecisionController {
  constructor(
    private readonly decideGateUserStory: DecideGateUserStory,
    private readonly listGateDecisionsUserStory: ListGateDecisionsUserStory,
  ) {}

  async decide(req: Request, res: Response): Promise<Response> {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication is required" });
    }

    try {
      const { decision, feedback, reviewPoints } = req.body;
      const output = await this.decideGateUserStory.execute({
        ideaId: req.params.id,
        deciderId: req.user.id,
        deciderRole: req.user.role,
        decision,
        feedback,
        reviewPoints,
      });

      return res.status(201).json(output);
    } catch (error: unknown) {
      return this.handleError(res, error, "Unable to decide gate");
    }
  }

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
    } catch (error: unknown) {
      return this.handleError(res, error, "Unable to list gate decisions");
    }
  }

  private handleError(res: Response, error: unknown, fallback: string): Response {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = statusByMessage[message];

    if (status) {
      return res.status(status).json({ error: message });
    }

    console.error(fallback, error);
    return res.status(500).json({ error: fallback });
  }
}
