import { Idea } from "../../domain/entities/Idea";
import { GateReview } from "../../domain/entities/GateReview";
import { UserRole } from "../../domain/entities/UserRole";

/**
 * Quem vê o histórico detalhado (pareceres e decisões) de uma ideia:
 * o autor, o Gestor e os avaliadores designados em alguma rodada dela.
 * O Administrador não acessa (D2/P3).
 */
export function canViewIdeaHistory(
  idea: Idea,
  reviews: GateReview[],
  requester: { id: string; role: UserRole | undefined },
): boolean {
  if (idea.authorId === requester.id) return true;
  if (requester.role === "GATEKEEPER") return true;
  if (requester.role === "EVALUATOR") {
    return reviews.some((r) => r.evaluators.some((e) => e.evaluatorId === requester.id));
  }
  return false;
}
