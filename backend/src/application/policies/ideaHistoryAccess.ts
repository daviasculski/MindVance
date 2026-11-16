import { Idea } from "../../domain/entities/Idea";
import { GateReview } from "../../domain/entities/GateReview";
import { UserRole } from "../../domain/entities/UserRole";

/** Quem pode consultar o histórico completo: autor, Gestor de Inovação e Admin. */
export function canViewIdeaHistory(
  idea: Idea,
  requester: { id: string; role: UserRole | undefined },
): boolean {
  if (idea.authorId === requester.id) return true;
  return requester.role === "GATEKEEPER" || requester.role === "ADMIN";
}

/** Evaluadores designados podem ver o conteúdo da ideia, mas não seu histórico detalhado. */
export function canViewIdeaDetails(
  idea: Idea,
  reviews: GateReview[],
  requester: { id: string; role: UserRole | undefined },
): boolean {
  if (canViewIdeaHistory(idea, requester)) return true;
  return (
    requester.role === "EVALUATOR" &&
    reviews.some((review) =>
      review.evaluators.some((evaluator) => evaluator.evaluatorId === requester.id),
    )
  );
}
