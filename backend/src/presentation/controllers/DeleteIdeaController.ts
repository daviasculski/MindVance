import { Request, Response } from "express";
import { DeleteIdeaUserStory } from "../../application/userstories/DeleteIdeaUserStory";

const forbiddenMessages = [
  "Only the author or an admin can delete this idea",
  "Authors can only delete ideas still in Ideation",
];

export class DeleteIdeaController {
  constructor(private readonly deleteIdeaUserStory: DeleteIdeaUserStory) {}

  async handle(req: Request, res: Response): Promise<Response> {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication is required" });
    }

    try {
      const { id } = req.params;
      await this.deleteIdeaUserStory.execute(id, {
        id: req.user.id,
        role: req.user.role,
      });

      return res.status(204).send();
    } catch (error: any) {
      if (error.message === "Ideia não encontrada") {
        return res.status(404).json({ error: error.message });
      }

      if (forbiddenMessages.includes(error.message)) {
        return res.status(403).json({ error: error.message });
      }

      return res
        .status(400)
        .json({ error: error.message || "Erro ao deletar ideia" });
    }
  }
}
