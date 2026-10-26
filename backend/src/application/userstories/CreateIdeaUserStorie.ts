import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { Idea } from "../../domain/entities/Idea";
import {
  CreateIdeaInputDTO,
  IdeaOutputDTO,
  toIdeaOutputDTO,
} from "../dtos/IdeaDTO";

export class CreateIdeaUserStorie {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  async execute(input: CreateIdeaInputDTO): Promise<IdeaOutputDTO> {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error("Idea title is required");
    }

    if (!input.authorId || input.authorId.trim().length === 0) {
      throw new Error("Idea authorId is required");
    }

    // UC01 FA01: os mesmos campos obrigatórios do formulário valem na API
    const extra = input.extraFields ?? {};
    const isFilled = (value: unknown) =>
      typeof value === "string" && value.trim().length > 0;

    if (!isFilled(input.description)) {
      throw new Error("Idea solution is required");
    }
    if (!isFilled(extra.problem)) {
      throw new Error("Idea problem is required");
    }
    if (!isFilled(extra.department)) {
      throw new Error("Idea department is required");
    }

    // Toda ideia nova aguarda a triagem do Gestor antes do Gate 1 (D6)
    const idea = new Idea({
      title: input.title,
      description: input.description,
      authorId: input.authorId,
      extraFields: extra,
      status: "AGUARDANDO_TRIAGEM",
    });

    const savedIdea = await this.ideaRepository.create(idea);

    return toIdeaOutputDTO(savedIdea);
  }
}
