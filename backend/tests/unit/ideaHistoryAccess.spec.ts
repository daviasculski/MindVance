import { Idea } from "../../src/domain/entities/Idea";
import { GateReview } from "../../src/domain/entities/GateReview";
import { canViewIdeaDetails, canViewIdeaHistory } from "../../src/application/policies/ideaHistoryAccess";

describe("idea history visibility", () => {
  const idea = new Idea({
    id: "idea-1",
    title: "Ideia",
    description: "Descrição",
    authorId: "author-1",
  });
  const reviews: GateReview[] = [
    {
      id: "review-1",
      ideaId: "idea-1",
      gateId: "gate-1",
      round: 1,
      status: "EM_AVALIACAO",
      requestedById: "author-1",
      openedAt: new Date(),
      deadlineAt: null,
      consolidatedScore: null,
      recommendation: null,
      overdueAt: null,
      evaluators: [
        {
          evaluatorId: "evaluator-1",
          assignedById: "manager-1",
          assignedAt: new Date(),
        },
      ],
    },
  ];

  it.each([
    ["author-1", "COLLABORATOR", true],
    ["manager-1", "GATEKEEPER", true],
    ["admin-1", "ADMIN", true],
    ["evaluator-1", "EVALUATOR", false],
    ["other-1", "COLLABORATOR", false],
  ] as const)("grants full history to %s with role %s: %s", (id, role, allowed) => {
    expect(canViewIdeaHistory(idea, { id, role })).toBe(allowed);
  });

  it("allows assigned evaluators to see idea details without revealing full history", () => {
    const evaluator = { id: "evaluator-1", role: "EVALUATOR" as const };
    const other = { id: "other-1", role: "COLLABORATOR" as const };

    expect(canViewIdeaDetails(idea, reviews, evaluator)).toBe(true);
    expect(canViewIdeaHistory(idea, evaluator)).toBe(false);
    expect(canViewIdeaDetails(idea, reviews, other)).toBe(false);
  });
});
