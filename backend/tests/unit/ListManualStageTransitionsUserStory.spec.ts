import { ManualStageTransition } from "../../src/domain/entities/ManualStageTransition";
import { IManualStageTransitionRepository } from "../../src/domain/repositories/IManualStageTransitionRepository";
import { IUserRepository } from "../../src/domain/repositories/IUserRepository";
import { User } from "../../src/domain/entities/User";
import { Idea } from "../../src/domain/entities/Idea";
import { IIdeaRepository } from "../../src/domain/repositories/IIdeaRepository";
import { ListManualStageTransitionsUserStory } from "../../src/application/userstories/ListManualStageTransitionsUserStory";

describe("ListManualStageTransitionsUserStory", () => {
  const createIdeaRepository = (): jest.Mocked<IIdeaRepository> => ({
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(
      new Idea({
        id: "idea-1",
        title: "Ideia",
        description: "Descrição",
        authorId: "author-1",
      }),
    ),
    findAll: jest.fn(),
    update: jest.fn(),
    updateProgress: jest.fn(),
    cancel: jest.fn(),
  });

  it("maps transition history to a readable actor name", async () => {
    const transition: ManualStageTransition = {
      id: "transition-1",
      ideaId: "idea-1",
      fromStage: "IDEACAO",
      toStage: "ESCOPO",
      reason: "Encaminhamento excepcional",
      changedById: "manager-1",
      createdAt: new Date("2026-11-10T12:00:00.000Z"),
    };
    const transitions: jest.Mocked<IManualStageTransitionRepository> = {
      moveIdea: jest.fn(),
      findByIdeaId: jest.fn().mockResolvedValue([transition]),
      findAll: jest.fn().mockResolvedValue([transition]),
    };
    const users: jest.Mocked<IUserRepository> = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByIds: jest.fn().mockResolvedValue([
        new User({
          id: "manager-1",
          name: "Gestor",
          email: "manager@example.com",
          password: "hashed",
          role: "GATEKEEPER",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]),
      findById: jest.fn(),
      findPendingApprovals: jest.fn(),
      updateApprovalStatus: jest.fn(),
      findAll: jest.fn(),
      updateRole: jest.fn(),
    };

    const result = await new ListManualStageTransitionsUserStory(
      transitions,
      users,
      createIdeaRepository(),
    ).execute("idea-1", { id: "manager-1", role: "GATEKEEPER" });

    expect(users.findByIds).toHaveBeenCalledWith(["manager-1"]);
    expect(result).toEqual([
      {
        ...transition,
        changedByName: "Gestor",
      },
    ]);
  });

  it("uses a fallback actor label when the user no longer exists", async () => {
    const transitions: jest.Mocked<IManualStageTransitionRepository> = {
      moveIdea: jest.fn(),
      findByIdeaId: jest.fn().mockResolvedValue([
        {
          id: "transition-1",
          ideaId: "idea-1",
          fromStage: "IDEACAO",
          toStage: "ESCOPO",
          reason: "Encaminhamento excepcional",
          changedById: "missing-user",
          createdAt: new Date(),
        },
      ]),
      findAll: jest.fn(),
    };
    const users: jest.Mocked<IUserRepository> = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByIds: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      findPendingApprovals: jest.fn(),
      updateApprovalStatus: jest.fn(),
      findAll: jest.fn(),
      updateRole: jest.fn(),
    };

    const result = await new ListManualStageTransitionsUserStory(
      transitions,
      users,
      createIdeaRepository(),
    ).execute("idea-1", { id: "manager-1", role: "GATEKEEPER" });

    expect(result[0].changedByName).toBe("Gestor");
  });

  it("allows the author to view movements and hides them from other users", async () => {
    const transition: ManualStageTransition = {
      id: "transition-1",
      ideaId: "idea-1",
      fromStage: "IDEACAO",
      toStage: "ESCOPO",
      reason: "Avanço",
      changedById: "manager-1",
      createdAt: new Date(),
    };
    const transitions: jest.Mocked<IManualStageTransitionRepository> = {
      moveIdea: jest.fn(),
      findByIdeaId: jest.fn().mockResolvedValue([transition]),
      findAll: jest.fn(),
    };
    const users: jest.Mocked<IUserRepository> = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByIds: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      findPendingApprovals: jest.fn(),
      updateApprovalStatus: jest.fn(),
      findAll: jest.fn(),
      updateRole: jest.fn(),
    };
    const list = new ListManualStageTransitionsUserStory(
      transitions,
      users,
      createIdeaRepository(),
    );

    await expect(list.execute("idea-1", { id: "author-1", role: "COLLABORATOR" }))
      .resolves.toHaveLength(1);
    await expect(list.execute("idea-1", { id: "other-1", role: "COLLABORATOR" }))
      .resolves.toEqual([]);
  });
});
