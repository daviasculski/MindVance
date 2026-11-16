import { Request, Response } from "express";
import { CreateIdeaUserStory } from "../../application/userstories/CreateIdeaUserStory";

export class IdeaController {
  constructor(private readonly createIdeaUserStory: CreateIdeaUserStory) {}

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const { title, description, extraFields } = req.body ?? {};

      // O autor é sempre o usuário autenticado, nunca um id vindo do corpo
      const authorId = req.user?.id;
      if (!authorId) {
        return res.status(401).json({ error: "Bearer token is required" });
      }

      const output = await this.createIdeaUserStory.execute({
        title,
        description,
        authorId,
        extraFields,
      });

      return res.status(201).json(output);
    } catch (error: unknown) {
      return res
        .status(400)
        .json({ error: error instanceof Error ? error.message : "Erro inesperado" });
    }
  }
}
