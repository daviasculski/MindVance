import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { Idea } from "../../domain/entities/Idea";
import {
  CreateIdeaInputDTO,
  IdeaOutputDTO,
  toIdeaOutputDTO,
} from "../dtos/IdeaDTO";
import { Notifier } from "../services/Notifier";

export class CreateIdeaUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly notifier?: Notifier,
  ) {}

  async execute(input: CreateIdeaInputDTO): Promise<IdeaOutputDTO> {
    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (title.length === 0) {
      throw new Error("Idea title is required");
    }
    if (title.length > 255) {
      throw new Error("Idea title must be at most 255 characters");
    }

    const authorId = typeof input.authorId === "string" ? input.authorId.trim() : "";
    if (authorId.length === 0) {
      throw new Error("Idea authorId is required");
    }

    // UC01 FA01: os mesmos campos obrigatórios do formulário valem na API
    const description = typeof input.description === "string" ? input.description.trim() : "";
    if (description.length === 0) {
      throw new Error("Idea solution is required");
    }

    const extra = input.extraFields ?? {};
    if (typeof extra !== "object" || Array.isArray(extra)) {
      throw new Error("Idea extraFields must be an object");
    }
    if (typeof extra.problem !== "string" || extra.problem.trim().length === 0) {
      throw new Error("Idea problem is required");
    }
    if (typeof extra.department !== "string" || extra.department.trim().length === 0) {
      throw new Error("Idea department is required");
    }

    // Toda ideia nova aguarda a triagem do Gestor antes do Gate 1 (D6)
    const idea = new Idea({
      title,
      description,
      authorId,
      currentStage: "IDEACAO",
      extraFields: {
        ...extra,
        problem: extra.problem.trim(),
        department: extra.department.trim(),
      },
      status: "AGUARDANDO_TRIAGEM",
    });

    const savedIdea = await this.ideaRepository.create(idea);
    await this.notifier?.ideaSubmitted(savedIdea);

    return toIdeaOutputDTO(savedIdea);
  }
}
