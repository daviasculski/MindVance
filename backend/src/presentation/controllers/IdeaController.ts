import { Request, Response } from "express";
import { CreateIdeaUseCase } from "../../application/use-cases/CreateIdeaUseCase";

export class IdeaController {
  constructor(private readonly createIdeaUseCase: CreateIdeaUseCase) {}

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const { title, description, authorId, extraFields } = req.body;

      const output = await this.createIdeaUseCase.execute({
        title,
        description,
        authorId,
        extraFields,
      });

      return res.status(201).json(output);
    } catch (error: any) {
      return res
        .status(400)
        .json({ error: error.message || "Unexpected error" });
    }
  }
}
