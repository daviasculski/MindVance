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

    const idea = new Idea({
      title: input.title,
      description: input.description,
      authorId: input.authorId,
      extraFields: input.extraFields ?? {},
    });

    const savedIdea = await this.ideaRepository.create(idea);

    return toIdeaOutputDTO(savedIdea);
  }
}
