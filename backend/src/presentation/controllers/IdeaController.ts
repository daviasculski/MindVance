import { Request, Response } from "express";
import { CreateIdeaUserStorie} from "../../application/userstories/CreateIdeaUserStorie";

export class IdeaController {
  constructor(private readonly createIdeaUserStorie: CreateIdeaUserStorie) {}

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const { title, description, extraFields } = req.body;

      // O autor é sempre o usuário autenticado, nunca um id vindo do corpo
      const authorId = req.user?.id;
      if (!authorId) {
        return res.status(401).json({ error: "Bearer token is required" });
      }

      const output = await this.createIdeaUserStorie.execute({
        title,
        description,
        authorId,
        extraFields,
      });

      return res.status(201).json(output);
    } catch (error: any) {
      return res
        .status(400)
        .json({ error: error.message || "Erro inesperado" });
    }
  }
}
