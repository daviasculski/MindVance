import { Request, Response } from "express";
import { GetInnovationMetricsUserStory } from "../../application/userstories/GetInnovationMetricsUserStory";
import { sendError } from "../http";

const statusByMessage: Record<string, number> = {
  "Invalid start date": 400,
  "Invalid end date": 400,
  "Start date must be before end date": 400,
};

export class GetInnovationMetricsController {
  constructor(private readonly getInnovationMetricsUserStory: GetInnovationMetricsUserStory) {}

  /** GET /ideas/metrics?startDate=&endDate= — período pela data de submissão (KPI-06) */
  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const metrics = await this.getInnovationMetricsUserStory.execute({
        startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
        endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
      });
      return res.status(200).json(metrics);
    } catch (error: unknown) {
      return sendError(res, error, statusByMessage, "Unable to retrieve innovation metrics");
    }
  }
}
