import { Request, Response } from "express";
import { SubmitEvaluationUserStory } from "../../application/userstories/SubmitEvaluationUserStory";
import { sendError } from "../http";

const statusByMessage: Record<string, number> = {
  "Every criterion of the gate must be scored": 400,
  "Evaluation score must be a number between 0 and 10": 400,
  "Criterion comment must be a text": 400,
  "Evaluation justification is required": 400,
  "Only users with the Evaluator role can submit evaluations": 403,
  "Only designated evaluators can evaluate this round": 403,
  "Authors cannot evaluate their own ideas": 403,
  "Gate review not found": 404,
  "Idea not found": 404,
  "Gate not found": 404,
  "This round is not open for evaluation": 409,
  "Idea already evaluated by this evaluator in this round": 409,
};

export class SubmitEvaluationController {
  constructor(private readonly submitEvaluationUserStory: SubmitEvaluationUserStory) {}

  async handle(req: Request, res: Response): Promise<Response> {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication is required" });
    }

    try {
      const { reviewId, criteria, justification } = req.body ?? {};
      const evaluation = await this.submitEvaluationUserStory.execute({
        reviewId,
        evaluatorId: req.user.id,
        evaluatorRole: req.user.role,
        criteria,
        justification,
      });

      return res.status(201).json(evaluation);
    } catch (error) {
      return sendError(res, error, statusByMessage, "Unable to submit evaluation");
    }
  }
}
