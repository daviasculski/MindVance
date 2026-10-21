import { Request, Response } from "express";
import { UpdateIdeaUserStory } from "../../application/userstories/UpdateIdeaUserStory";

const forbiddenMessages = [
  "Only the author can edit this idea",
  "Idea can only be edited during Ideation or when returned for revision",
];

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
    } catch (error: any) {
      if (error.message === "Ideia não encontrada") {
        return res.status(404).json({ error: error.message });
      }

      if (forbiddenMessages.includes(error.message)) {
        return res.status(403).json({ error: error.message });
      }

      return res
        .status(400)
        .json({ error: error.message || "Erro ao atualizar ideia" });
    }
  }
}
