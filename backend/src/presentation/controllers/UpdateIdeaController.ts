import { Request, Response } from "express";
import { UpdateIdeaUserStory } from "../../application/userstories/UpdateIdeaUserStory";
<<<<<<< HEAD

const forbiddenMessages = [
  "Only the author can edit this idea",
  "Idea cannot be edited while in a gate or after it was closed",
];
=======
import { sendError } from "../http";
>>>>>>> feature/editar-cancelar-ideia

export class UpdateIdeaController {
  constructor(private readonly updateIdeaUserStory: UpdateIdeaUserStory) {}

  async handle(req: Request, res: Response): Promise<Response> {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication is required" });
    }

    try {
      const { id } = req.params;
      // authorId do corpo é ignorado: o autor de uma ideia não muda
      const { title, description, extraFields } = req.body;

      const updatedIdea = await this.updateIdeaUserStory.execute(
        id,
        { title, description, extraFields },
        { id: req.user.id, role: req.user.role },
      );

      return res.status(200).json(updatedIdea);
    } catch (error) {
      return sendError(
        res,
        error,
        {
          "Ideia não encontrada": 404,
          "Only the author can edit this idea": 403,
          "Idea can only be edited while awaiting initial triage": 403,
          "Idea cannot be edited after evaluations have been registered": 403,
          "Idea title is required": 400,
        },
        "Unable to update idea",
      );
    }
  }
}
