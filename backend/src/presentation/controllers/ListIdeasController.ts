import { Request, Response } from "express";
import { ListIdeasUserStory } from "../../application/userstories/ListIdeasUserStory";
import { ListIdeasFiltersDTO } from "../../application/dtos/ListIdeasFiltersDTO";
import { sendError } from "../http";

const statusByMessage: Record<string, number> = {
  "Only the gatekeeper can list all ideas": 403,
};

export class ListIdeasController {
  constructor(private readonly listIdeasUserStory: ListIdeasUserStory) {}

  async handle(req: Request, res: Response): Promise<Response> {
    const query = (key: string) =>
      typeof req.query[key] === "string" ? (req.query[key] as string) : undefined;

    const filters: ListIdeasFiltersDTO = {
      stage: query("stage") ?? query("currentStage"),
      status: query("status"),
      startDate: query("startDate"),
      endDate: query("endDate"),
      authorId: query("authorId"),
    };

    try {
      const ideas = await this.listIdeasUserStory.execute(filters, {
        id: req.user!.id,
        role: req.user!.role,
      });
      return res.status(200).json(ideas);
    } catch (error: unknown) {
      // Filtro de estágio/status inválido
      if (error instanceof Error && error.message.startsWith("Invalid idea")) {
        return res.status(400).json({ error: error.message });
      }
      return sendError(res, error, statusByMessage, "Erro interno ao listar ideias");
    }
  }
}
