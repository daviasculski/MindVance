import { Request, Response } from "express";
import { CreateIdeaUserStorie} from "../../application/userstories/CreateIdeaUserStorie";

export class IdeaController {
  constructor(private readonly createIdeaUserStorie: CreateIdeaUserStorie) {}

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const { title, description, authorId, extraFields } = req.body;

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
