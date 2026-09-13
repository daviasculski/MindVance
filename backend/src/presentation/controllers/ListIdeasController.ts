import { Request, Response } from "express";
import { ListIdeasUserStory } from "../../application/userstories/ListIdeasUserStory";

export class ListIdeasController {
  constructor(private readonly listIdeasUserStory: ListIdeasUserStory) {}

  async handle(_req: Request, res: Response): Promise<Response> {
    try {
      const ideas = await this.listIdeasUserStory.execute();
      return res.status(200).json(ideas);
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: error.message || "Erro interno ao listar ideias" });
    }
  }
}
