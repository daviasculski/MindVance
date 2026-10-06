import { Request, Response } from "express";
import { isIdeaStage } from "../../domain/entities/IdeaStage";
import { AdvanceIdeaStageUserStory } from "../../application/userstories/AdvanceIdeaStageUserStory";

export class AdvanceIdeaStageController {
  constructor(
    private readonly advanceIdeaStageUserStory: AdvanceIdeaStageUserStory,
  ) {}

  async handle(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { stage } = req.body;

    if (!isIdeaStage(stage)) {
      return res.status(400).json({ error: "Invalid idea stage" });
    }

    try {
      const updatedIdea = await this.advanceIdeaStageUserStory.execute(
        id,
        stage,
      );

      return res.status(200).json(updatedIdea);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "Idea not found") {
        return res.status(404).json({ error: error.message });
      }

      if (
        error instanceof Error &&
        error.message === "Cannot advance idea with pending evaluations"
      ) {
        return res.status(400).json({ error: error.message });
      }

      console.error("Failed to advance idea stage:", error);
      return res.status(500).json({ error: "Unable to advance idea stage" });
    }
  }
}
