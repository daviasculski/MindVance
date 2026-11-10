import { Evaluation } from "../../src/domain/entities/Evaluation";
import { Gate } from "../../src/domain/entities/Gate";
import { GateReview } from "../../src/domain/entities/GateReview";
import { Idea } from "../../src/domain/entities/Idea";
import { IEvaluationRepository } from "../../src/domain/repositories/IEvaluationRepository";
import { IGateRepository } from "../../src/domain/repositories/IGateRepository";
import { IGateReviewRepository } from "../../src/domain/repositories/IGateReviewRepository";
import { IIdeaRepository } from "../../src/domain/repositories/IIdeaRepository";
import { SubmitEvaluationUserStory } from "../../src/application/userstories/SubmitEvaluationUserStory";

const gate: Gate = {
  id: "gate-1",
  orderIndex: 1,
  name: "Gate 1",
  fromStage: "IDEACAO",
  toStage: "ESCOPO",
  deliverable: "Proposta",
  deadlineDays: 7,
  approveThreshold: 7,
  reviseThreshold: 4,
  criteria: [
    { id: "ae", name: "Alinhamento estratégico", description: "", weight: 30, orderIndex: 0 },
    { id: "vt", name: "Viabilidade técnica", description: "", weight: 25, orderIndex: 1 },
    { id: "pm", name: "Potencial de mercado", description: "", weight: 25, orderIndex: 2 },
    { id: "re", name: "Risco e execução", description: "", weight: 20, orderIndex: 3 },
  ],
};

const idea = new Idea({
  id: "idea-1",
  title: "Ideia",
  description: "Solução",
  authorId: "author-1",
  status: "EM_ANDAMENTO",
});

const review: GateReview = {
  id: "review-1",
  ideaId: "idea-1",
  gateId: "gate-1",
  round: 1,
  status: "EM_AVALIACAO",
  requestedById: "author-1",
  openedAt: new Date("2026-01-01T00:00:00.000Z"),
  deadlineAt: null,
  consolidatedScore: null,
  recommendation: null,
  overdueAt: null,
  evaluators: [
    {
      evaluatorId: "evaluator-1",
      assignedById: "manager-1",
      assignedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  ],
};

describe("SubmitEvaluationUserStory", () => {
  let evaluations: jest.Mocked<IEvaluationRepository>;
  let ideas: jest.Mocked<IIdeaRepository>;
  let gates: jest.Mocked<IGateRepository>;
  let reviews: jest.Mocked<IGateReviewRepository>;

  const createStory = () => {
    evaluations.create.mockImplementation(async (evaluation) =>
      new Evaluation({
        id: "evaluation-1",
        ideaId: evaluation.ideaId,
        evaluatorId: evaluation.evaluatorId,
        score: evaluation.score,
        justification: evaluation.justification,
        stage: evaluation.stage,
        reviewId: evaluation.reviewId,
        criteria: evaluation.criteria,
      }),
    );
    return new SubmitEvaluationUserStory(evaluations, ideas, gates, reviews);
  };

  const input = (score: number) => ({
    reviewId: "review-1",
    evaluatorId: "evaluator-1",
    evaluatorRole: "EVALUATOR" as const,
    justification: "Análise dos critérios e evidências",
    criteria: [
      { criterionId: "ae", score },
      { criterionId: "vt", score },
      { criterionId: "pm", score },
      { criterionId: "re", score },
    ],
  });

  beforeEach(() => {
    evaluations = {
      create: jest.fn(),
      findByIdeaId: jest.fn(),
      findByReviewId: jest.fn().mockResolvedValue([]),
      findByEvaluatorId: jest.fn(),
    };
    ideas = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(idea),
      findAll: jest.fn(),
      update: jest.fn(),
      updateProgress: jest.fn(),
      cancel: jest.fn(),
    };
    gates = {
      findAll: jest.fn(),
      findById: jest.fn().mockResolvedValue(gate),
      findByFromStage: jest.fn(),
    };
    reviews = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(review),
      findByIdea: jest.fn(),
      lastRound: jest.fn(),
      findByStatus: jest.fn(),
      findAll: jest.fn(),
      findAssignedTo: jest.fn(),
      assignEvaluators: jest.fn(),
      markReadyForDecision: jest.fn(),
      markDecided: jest.fn(),
      cancelOpenForIdea: jest.fn(),
      markOverdue: jest.fn(),
    };
  });

  it("calcula exatamente a nota ponderada e consolida quando todos avaliaram", async () => {
    const result = await createStory().execute({
      ...input(0),
      criteria: [
        { criterionId: "ae", score: 10 },
        { criterionId: "vt", score: 8 },
        { criterionId: "pm", score: 6 },
        { criterionId: "re", score: 4 },
      ],
    });

    expect(result.score).toBe(7.3);
    expect(reviews.markReadyForDecision).toHaveBeenCalledWith(
      "review-1",
      7.3,
      "APROVADA",
    );
    expect(ideas.updateProgress).toHaveBeenCalledWith("idea-1", {
      status: "AGUARDANDO_DECISAO",
    });
  });

  it.each([
    [7, "APROVADA"],
    [4, "REVISAO"],
    [3.99, "REJEITADA"],
  ] as const)(
    "gera recomendação %s => %s conforme os limites configurados no gate",
    async (score, expectedRecommendation) => {
      const result = await createStory().execute(input(score));

      expect(result.score).toBe(score);
      expect(reviews.markReadyForDecision).toHaveBeenCalledWith(
        "review-1",
        score,
        expectedRecommendation,
      );
    },
  );

  it("rejeita uma justificativa ausente ou em branco", async () => {
    await expect(
      createStory().execute({ ...input(8), justification: "  " }),
    ).rejects.toThrow("Evaluation justification is required");
    expect(evaluations.create).not.toHaveBeenCalled();
  });

  it("rejeita notas fora da escala", async () => {
    await expect(
      createStory().execute({
        ...input(8),
        criteria: [{ criterionId: "ae", score: 11 }],
      }),
    ).rejects.toThrow("Evaluation score must be a number between 0 and 10");
    expect(evaluations.create).not.toHaveBeenCalled();
  });

  it.each([
    ["not an array", "Every criterion of the gate must be scored"],
    [
      [{ criterionId: "ae", score: 8 }],
      "Every criterion of the gate must be scored",
    ],
    [
      [
        { criterionId: "ae", score: 8, comment: 123 },
        { criterionId: "vt", score: 8 },
        { criterionId: "pm", score: 8 },
        { criterionId: "re", score: 8 },
      ],
      "Criterion comment must be a text",
    ],
  ])("rejeita critérios inválidos: %s", async (criteria, message) => {
    await expect(
      createStory().execute({ ...input(8), criteria }),
    ).rejects.toThrow(message);
    expect(evaluations.create).not.toHaveBeenCalled();
  });

  it.each([
    ["COLLABORATOR", "Only users with the Evaluator role can submit evaluations"],
    ["EVALUATOR", "Gate review not found"],
  ] as const)(
    "rejeita usuário sem papel avaliador ou rodada inexistente",
    async (role, message) => {
      if (role === "EVALUATOR") {
        reviews.findById.mockResolvedValue(null);
      }
      await expect(
        createStory().execute({ ...input(8), evaluatorRole: role }),
      ).rejects.toThrow(message);
    },
  );

  it.each([
    ["not assigned", "Only designated evaluators can evaluate this round"],
    ["cancelled", "Idea has been cancelled"],
    ["closed", "This round is not open for evaluation"],
  ])("rejeita uma rodada %s", async (caseName, message) => {
    if (caseName === "not assigned") {
      reviews.findById.mockResolvedValue({ ...review, evaluators: [] });
    } else if (caseName === "cancelled") {
      reviews.findById.mockResolvedValue({ ...review, status: "CANCELADA" });
    } else {
      reviews.findById.mockResolvedValue({ ...review, status: "DECIDIDA" });
    }

    await expect(createStory().execute(input(8))).rejects.toThrow(message);
  });

  it.each([
    ["missing", "Idea not found"],
    ["cancelled", "Idea has been cancelled"],
    ["authored by evaluator", "Authors cannot evaluate their own ideas"],
  ])("rejeita uma ideia %s", async (caseName, message) => {
    if (caseName === "missing") {
      ideas.findById.mockResolvedValue(null);
    } else if (caseName === "cancelled") {
      ideas.findById.mockResolvedValue(
        new Idea({ ...idea.toJSON(), status: "CANCELLED" }),
      );
    } else {
      ideas.findById.mockResolvedValue(
        new Idea({ ...idea.toJSON(), authorId: "evaluator-1" }),
      );
    }

    await expect(createStory().execute(input(8))).rejects.toThrow(message);
  });

  it("rejeita um gate inexistente e avaliações duplicadas", async () => {
    gates.findById.mockResolvedValueOnce(null);
    await expect(createStory().execute(input(8))).rejects.toThrow("Gate not found");

    evaluations.findByReviewId.mockResolvedValue([
      new Evaluation({
        id: "existing",
        ideaId: idea.id!,
        evaluatorId: "evaluator-1",
        score: 8,
        justification: "Already submitted",
        stage: "IDEACAO",
        reviewId: review.id,
      }),
    ]);
    await expect(createStory().execute(input(8))).rejects.toThrow(
      "Idea already evaluated by this evaluator in this round",
    );
  });

  it("não conclui a rodada enquanto outro avaliador designado estiver pendente", async () => {
    reviews.findById.mockResolvedValue({
      ...review,
      evaluators: [
        ...review.evaluators,
        {
          evaluatorId: "evaluator-2",
          assignedById: "manager-1",
          assignedAt: new Date(),
        },
      ],
    });

    await createStory().execute(input(8));

    expect(reviews.markReadyForDecision).not.toHaveBeenCalled();
    expect(ideas.updateProgress).not.toHaveBeenCalled();
  });
});
