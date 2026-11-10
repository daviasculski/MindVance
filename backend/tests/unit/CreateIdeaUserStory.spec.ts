import { Idea } from "../../src/domain/entities/Idea";
import { IIdeaRepository } from "../../src/domain/repositories/IIdeaRepository";
import { CreateIdeaUserStorie } from "../../src/application/userstories/CreateIdeaUserStorie";

describe("CreateIdeaUserStorie", () => {
  const extraFields = {
    problem: "Processo manual e lento",
    department: "Operações",
    impact: "Reduzir o tempo de atendimento",
    customData: { source: "workshop" },
  };
  let repository: jest.Mocked<IIdeaRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      updateProgress: jest.fn(),
      cancel: jest.fn(),
    };
  });

  it("cria uma ideia válida e preserva os campos dinâmicos", async () => {
    repository.create.mockImplementation(async (idea) =>
      new Idea({
        id: "idea-1",
        title: idea.title,
        description: idea.description,
        authorId: idea.authorId,
        extraFields: idea.extraFields,
        status: idea.status,
        currentStage: idea.currentStage,
      }),
    );

    const result = await new CreateIdeaUserStorie(repository).execute({
      title: "Automatizar o atendimento",
      description: "Criar um fluxo de triagem automatizado",
      authorId: "user-1",
      extraFields,
    });

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Automatizar o atendimento",
        authorId: "user-1",
        extraFields,
        status: "AGUARDANDO_TRIAGEM",
      }),
    );
    expect(result.extraFields).toEqual(extraFields);
    expect(result.status).toBe("AGUARDANDO_TRIAGEM");
  });

  it.each([
    [{ title: "  " }, "Idea title is required"],
    [{ authorId: " " }, "Idea authorId is required"],
    [{ description: " " }, "Idea solution is required"],
    [{ extraFields: { department: "Operações" } }, "Idea problem is required"],
    [{ extraFields: { problem: "Problema" } }, "Idea department is required"],
  ])("rejects incomplete required data: %s", async (override, message) => {
    await expect(
      new CreateIdeaUserStorie(repository).execute({
        title: "Ideia",
        description: "Solução",
        authorId: "user-1",
        extraFields,
        ...override,
      }),
    ).rejects.toThrow(message);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
