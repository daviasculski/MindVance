import { Request, Response } from "express";
import { ListIdeaEvaluationsUserStory } from "../../application/userstories/ListIdeaEvaluationsUserStory";

export class ListIdeaEvaluationsController {
  constructor(
    private readonly listIdeaEvaluationsUserStory: ListIdeaEvaluationsUserStory,
  ) {}

  async handle(req: Request, res: Response): Promise<Response> {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication is required" });
    }

    try {
      const evaluations = await this.listIdeaEvaluationsUserStory.execute({
        ideaId: req.params.id,
        requesterId: req.user.id,
        requesterRole: req.user.role,
      });

      return res.status(200).json(evaluations);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unexpected error";

      if (message === "Idea not found") {
        return res.status(404).json({ error: message });
      }

      if (message === "Only the idea author can view its evaluations") {
        return res.status(403).json({ error: message });
      }

      console.error("Listing idea evaluations failed:", error);
      return res.status(500).json({ error: "Unable to list evaluations" });
    }
  }
}
