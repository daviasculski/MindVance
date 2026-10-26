import { Request, Response } from "express";
import { GetIdeaByIdUserStory } from "../../application/userstories/GetIdeaByIdUserStory";
import { sendError } from "../http";

const statusByMessage: Record<string, number> = {
  "You cannot view this idea": 403,
  "Ideia não encontrada": 404,
};

export class GetIdeaByIdController {
  constructor(private readonly getIdeaByIdUserStory: GetIdeaByIdUserStory) {}

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const idea = await this.getIdeaByIdUserStory.execute(req.params.id, {
        id: req.user!.id,
        role: req.user!.role,
      });

      return res.status(200).json(idea);
    } catch (error: unknown) {
      return sendError(res, error, statusByMessage, "Erro ao buscar ideia");
    }
  }
}
