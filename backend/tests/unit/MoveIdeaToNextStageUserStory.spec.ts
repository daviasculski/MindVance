import { Idea, IdeaProps } from "../../src/domain/entities/Idea";
import { IManualStageTransitionRepository } from "../../src/domain/repositories/IManualStageTransitionRepository";
import { IIdeaRepository } from "../../src/domain/repositories/IIdeaRepository";
import { MoveIdeaToNextStageUserStory } from "../../src/application/userstories/MoveIdeaToNextStageUserStory";

describe("MoveIdeaToNextStageUserStory", () => {
  const activeIdea = (overrides: Partial<IdeaProps> = {}) => {
    const defaults: IdeaProps = {
      id: "idea-1",
      title: "Automação de processo",
      description: "Solução",
      authorId: "author-1",
      status: "AGUARDANDO_TRIAGEM",
      currentStage: "IDEACAO",
    };
    return new Idea({ ...defaults, ...overrides });
  };

  let ideaRepository: jest.Mocked<IIdeaRepository>;
  let transitionRepository: jest.Mocked<IManualStageTransitionRepository>;
  const story = () =>
    new MoveIdeaToNextStageUserStory(ideaRepository, transitionRepository);

  beforeEach(() => {
    ideaRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(activeIdea()),
      findAll: jest.fn(),
      update: jest.fn(),
      updateProgress: jest.fn(),
      cancel: jest.fn(),
    };
    transitionRepository = {
      moveIdea: jest.fn().mockImplementation(async (input) => ({
        id: "transition-1",
        ideaId: input.ideaId,
        fromStage: input.expectedStage,
        toStage: input.toStage,
        reason: input.reason,
        changedById: input.changedById,
        createdAt: new Date("2026-11-10T12:00:00.000Z"),
      })),
      findByIdeaId: jest.fn(),
      findAll: jest.fn(),
    };
  });

  it.each([
    ["GATEKEEPER", "ESCOPO", "EM_ANDAMENTO"],
    ["ADMIN", "ESCOPO", "EM_ANDAMENTO"],
  ] as const)(
    "permite o próximo estágio para %s, exigindo justificativa auditável",
    async (role, toStage, toStatus) => {
      const result = await story().execute({
        ideaId: "idea-1",
        changedById: "manager-1",
        changedByRole: role,
        reason: "  Aprovação excepcional registrada  ",
      });

      expect(transitionRepository.moveIdea).toHaveBeenCalledWith({
        ideaId: "idea-1",
        expectedStage: "IDEACAO",
        expectedStatus: "AGUARDANDO_TRIAGEM",
        toStage,
        toStatus,
        reason: "Aprovação excepcional registrada",
        changedById: "manager-1",
      });
      expect(result.idea.currentStage).toBe("ESCOPO");
      expect(result.idea.status).toBe("EM_ANDAMENTO");
      expect(result.transition.reason).toBe("Aprovação excepcional registrada");
    },
  );

  it("allows only one-stage-at-a-time progression and preserves the final gate decision", async () => {
    ideaRepository.findById.mockResolvedValue(
      activeIdea({
        currentStage: "TESTE_E_VALIDACAO",
        status: "EM_ANDAMENTO",
      }),
    );

    await expect(
      story().execute({
        ideaId: "idea-1",
        changedById: "manager-1",
        changedByRole: "GATEKEEPER",
        reason: "Encaminhar ao estágio final",
      }),
    ).rejects.toThrow("Final stage can only be reached by formal gate approval");
    expect(transitionRepository.moveIdea).not.toHaveBeenCalled();
  });

  it("rejects an idea already at the final stage", async () => {
    ideaRepository.findById.mockResolvedValue(
      activeIdea({
        currentStage: "LANCAMENTO",
        status: "EM_ANDAMENTO",
      }),
    );

    await expect(
      story().execute({
        ideaId: "idea-1",
        changedById: "manager-1",
        changedByRole: "ADMIN",
        reason: "Justificativa",
      }),
    ).rejects.toThrow("Idea is already in the final stage");
  });

  it.each([
    ["COLLABORATOR", "Only gatekeepers and administrators can move ideas manually"],
    ["EVALUATOR", "Only gatekeepers and administrators can move ideas manually"],
  ] as const)("denies the %s role", async (role, message) => {
    await expect(
      story().execute({
        ideaId: "idea-1",
        changedById: "user-1",
        changedByRole: role,
        reason: "Justificativa",
      }),
    ).rejects.toThrow(message);
    expect(ideaRepository.findById).not.toHaveBeenCalled();
  });

  it("rejects empty reasons and missing ideas", async () => {
    await expect(
      story().execute({
        ideaId: "idea-1",
        changedById: "manager-1",
        changedByRole: "GATEKEEPER",
        reason: " ",
      }),
    ).rejects.toThrow("A reason is required for a manual stage transition");

    ideaRepository.findById.mockResolvedValue(null);
    await expect(
      story().execute({
        ideaId: "missing",
        changedById: "manager-1",
        changedByRole: "GATEKEEPER",
        reason: "Justificativa",
      }),
    ).rejects.toThrow("Idea not found");
  });

  it.each(["EM_AVALIACAO", "AGUARDANDO_DECISAO", "REJEITADA", "CANCELLED", "APROVADA"] as const)(
    "rejects a manual move for status %s",
    async (status) => {
      ideaRepository.findById.mockResolvedValue(activeIdea({ status }));

      await expect(
        story().execute({
          ideaId: "idea-1",
          changedById: "manager-1",
          changedByRole: "GATEKEEPER",
          reason: "Justificativa",
        }),
      ).rejects.toThrow("Idea cannot be moved manually in its current status");
      expect(transitionRepository.moveIdea).not.toHaveBeenCalled();
    },
  );
});
