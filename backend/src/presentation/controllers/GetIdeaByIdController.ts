import { Request, Response } from "express";
import { GetIdeaByIdUserStory } from "../../application/userstories/GetIdeaByIdUserStory";

export class GetIdeaByIdController {
  constructor(private readonly getIdeaByIdUserStory: GetIdeaByIdUserStory) {}

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const idea = await this.getIdeaByIdUserStory.execute(id);

      return res.status(200).json(idea);
    } catch (error: any) {
      return res
        .status(404)
        .json({ error: error.message || "Ideia não encontrada" });
    }
  }
}
