import { Request, Response } from "express";
import { GetEvaluationQueueUserStory } from "../../application/userstories/GetEvaluationQueueUserStory";

export class GetEvaluationQueueController {
  constructor(
    private readonly getEvaluationQueueUserStory: GetEvaluationQueueUserStory,
  ) {}

  async handle(req: Request, res: Response): Promise<Response> {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication is required" });
    }

    try {
      const queue = await this.getEvaluationQueueUserStory.execute({
        requesterId: req.user.id,
        requesterRole: req.user.role,
      });

      return res.status(200).json(queue);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unexpected error";

      if (
        message === "Only users with the Evaluator role have an evaluation queue"
      ) {
        return res.status(403).json({ error: message });
      }

      console.error("Loading evaluation queue failed:", error);
      return res.status(500).json({ error: "Unable to load evaluation queue" });
    }
  }
}
