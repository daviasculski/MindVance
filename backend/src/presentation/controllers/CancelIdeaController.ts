import { Request, Response } from "express";
import { CancelIdeaUserStory } from "../../application/userstories/CancelIdeaUserStory";
import { sendError } from "../http";

export class CancelIdeaController {
  constructor(private readonly cancelIdeaUserStory: CancelIdeaUserStory) {}

  async handle(req: Request, res: Response): Promise<Response> {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication is required" });
    }

    try {
      const cancelledIdea = await this.cancelIdeaUserStory.execute(req.params.id, {
        id: req.user.id,
        role: req.user.role,
      });

      return res.status(200).json(cancelledIdea);
    } catch (error) {
      return sendError(
        res,
        error,
        {
          "Ideia não encontrada": 404,
          "Only the author or a manager can cancel this idea": 403,
          "Idea has already been cancelled": 409,
        },
        "Unable to cancel idea",
      );
    }
  }
}
