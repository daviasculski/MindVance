import { Request, Response } from "express";
import { GetInnovationMetricsUserStory } from "../../application/userstories/GetInnovationMetricsUserStory";

export class GetInnovationMetricsController {
  constructor(
    private readonly getInnovationMetricsUserStory: GetInnovationMetricsUserStory,
  ) {}

  async handle(_req: Request, res: Response): Promise<Response> {
    try {
      const metrics = await this.getInnovationMetricsUserStory.execute();
      return res.status(200).json(metrics);
    } catch (error: unknown) {
      console.error("Failed to retrieve innovation metrics:", error);
      return res
        .status(500)
        .json({ error: "Unable to retrieve innovation metrics" });
    }
  }
}
