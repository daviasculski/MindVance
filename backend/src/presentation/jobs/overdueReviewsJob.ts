import { CheckOverdueReviewsUserStory } from "../../application/userstories/CheckOverdueReviewsUserStory";
import { PrismaEvaluationRepository } from "../../infrastructure/repositories/PrismaEvaluationRepository";
import { PrismaGateRepository } from "../../infrastructure/repositories/PrismaGateRepository";
import { PrismaGateReviewRepository } from "../../infrastructure/repositories/PrismaGateReviewRepository";
import { PrismaIdeaRepository } from "../../infrastructure/repositories/PrismaIdeaRepository";
import { notifier } from "../dependencies";

export const checkOverdueReviews = new CheckOverdueReviewsUserStory(
  new PrismaIdeaRepository(),
  new PrismaGateRepository(),
  new PrismaGateReviewRepository(),
  new PrismaEvaluationRepository(),
  notifier,
);

/** Rotina periódica de prazo vencido (UC02 FA02). Roda já na subida do servidor. */
export function startOverdueReviewsJob(intervalMs: number): NodeJS.Timeout {
  const run = async () => {
    try {
      const flagged = await checkOverdueReviews.execute();
      if (flagged > 0) console.log(`Prazo vencido registrado em ${flagged} rodada(s) de avaliação.`);
    } catch (error) {
      console.error("Overdue reviews check failed:", error);
    }
  };
  void run();
  return setInterval(run, intervalMs);
}
