import { Request, Response } from "express";
import { ListManualStageTransitionsUserStory } from "../../application/userstories/ListManualStageTransitionsUserStory";
import { MoveIdeaToNextStageUserStory } from "../../application/userstories/MoveIdeaToNextStageUserStory";

const statusByMessage: Record<string, number> = {
  "Only gatekeepers and administrators can move ideas manually": 403,
  "A reason is required for a manual stage transition": 400,
  "Idea not found": 404,
  "Idea cannot be moved manually in its current status": 409,
  "Idea is already in the final stage": 409,
  "Final stage can only be reached by formal gate approval": 409,
  "Idea changed while the stage transition was in progress": 409,
};

export class ManualStageTransitionController {
  constructor(
    private readonly moveIdea: MoveIdeaToNextStageUserStory,
    private readonly listTransitions: ListManualStageTransitionsUserStory,
  ) {}

  async move(req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.moveIdea.execute({
        ideaId: req.params.id,
        changedById: req.user!.id,
        changedByRole: req.user!.role,
        reason: req.body?.reason,
      });
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      const status = statusByMessage[message];
      if (status) return res.status(status).json({ error: message });
      console.error("Manual stage transition failed:", error);
      return res.status(500).json({ error: "Unable to move idea to the next stage" });
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json(await this.listTransitions.execute(req.params.id));
    } catch (error) {
      console.error("Listing manual stage transitions failed:", error);
      return res.status(500).json({ error: "Unable to list manual stage transitions" });
    }
  }
}
