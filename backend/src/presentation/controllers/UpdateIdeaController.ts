import { Request, Response } from "express";
import { UpdateIdeaUserStory } from "../../application/userstories/UpdateIdeaUserStory";

export class UpdateIdeaController {
  constructor(private readonly updateIdeaUserStory: UpdateIdeaUserStory) {}

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { title, description, authorId, extraFields } = req.body;

      const updatedIdea = await this.updateIdeaUserStory.execute(id, {
        title,
        description,
        authorId,
        extraFields,
      });

      return res.status(200).json(updatedIdea);
    } catch (error: any) {
      if (error.message === "Ideia não encontrada") {
        return res.status(404).json({ error: error.message });
      }

      return res
        .status(400)
        .json({ error: error.message || "Erro ao atualizar ideia" });
    }
  }
}
