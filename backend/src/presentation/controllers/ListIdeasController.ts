import { Request, Response } from "express";
import { ListIdeasUserStory } from "../../application/userstories/ListIdeasUserStory";
import { ListIdeasFiltersDTO } from "../../application/dtos/ListIdeasFiltersDTO";

export class ListIdeasController {
  constructor(private readonly listIdeasUserStory: ListIdeasUserStory) {}

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const filters: ListIdeasFiltersDTO = {
        stage:
          typeof req.query.stage === "string"
            ? req.query.stage
            : typeof req.query.currentStage === "string"
              ? req.query.currentStage
              : undefined,
        status:
          typeof req.query.status === "string" ? req.query.status : undefined,
        startDate:
          typeof req.query.startDate === "string"
            ? req.query.startDate
            : undefined,
        endDate:
          typeof req.query.endDate === "string" ? req.query.endDate : undefined,
        authorId:
          typeof req.query.authorId === "string"
            ? req.query.authorId
            : undefined,
      };

      const ideas = await this.listIdeasUserStory.execute(filters);
      return res.status(200).json(ideas);
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: error.message || "Erro interno ao listar ideias" });
    }
  }
}
