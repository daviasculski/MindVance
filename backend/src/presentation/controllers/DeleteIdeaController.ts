import { Request, Response } from "express";
import { DeleteIdeaUserStory } from "../../application/userstories/DeleteIdeaUserStory";

export class DeleteIdeaController {
  constructor(private readonly deleteIdeaUserStory: DeleteIdeaUserStory) {}

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      await this.deleteIdeaUserStory.execute(id);

      return res.status(204).send();
    } catch (error: any) {
      if (error.message === "Ideia não encontrada") {
        return res.status(404).json({ error: error.message });
      }

      return res
        .status(400)
        .json({ error: error.message || "Erro ao deletar ideia" });
    }
  }
}
