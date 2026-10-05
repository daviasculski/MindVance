import { Request, Response } from "express";
import { SubmitEvaluationUserStory } from "../../application/userstories/SubmitEvaluationUserStory";

export class SubmitEvaluationController {
  constructor(
    private readonly submitEvaluationUserStory: SubmitEvaluationUserStory,
  ) {}

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { ideaId, evaluatorId, score, justification } = req.body;

      const evaluation = await this.submitEvaluationUserStory.execute({
        ideaId,
        evaluatorId,
        score,
        justification,
      });

      return res.status(201).json(evaluation);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unexpected error";

      return res.status(400).json({ error: message });
    }
  }
}
