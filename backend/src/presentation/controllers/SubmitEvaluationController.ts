import { Request, Response } from "express";
import { SubmitEvaluationUserStory } from "../../application/userstories/SubmitEvaluationUserStory";

export class SubmitEvaluationController {
  constructor(
    private readonly submitEvaluationUserStory: SubmitEvaluationUserStory,
  ) {}

  async handle(req: Request, res: Response): Promise<Response> {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication is required" });
    }

    try {
      const { ideaId, score, justification, criteria } = req.body;

      const evaluation = await this.submitEvaluationUserStory.execute({
        ideaId,
        evaluatorId: req.user.id,
        evaluatorRole: req.user.role,
        score,
        justification,
        criteria,
      });

      return res.status(201).json(evaluation);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unexpected error";

      if (
        message ===
          "Only users with the Evaluator role can submit evaluations" ||
        message === "Authors cannot evaluate their own ideas"
      ) {
        return res.status(403).json({ error: message });
      }

      if (message === "Idea not found") {
        return res.status(404).json({ error: message });
      }

      if (message === "Idea already evaluated by this evaluator in this stage") {
        return res.status(409).json({ error: message });
      }

      return res.status(400).json({ error: message });
    }
  }
}
