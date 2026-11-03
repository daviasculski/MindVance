import { IdeaStatus } from "../../domain/entities/IdeaStatus";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import {
  IdeaOutputDTO,
  RequesterDTO,
  UpdateIdeaInputDTO,
  toIdeaOutputDTO,
} from "../dtos/IdeaDTO";

const editableStatuses: IdeaStatus[] = ["AGUARDANDO_TRIAGEM", "EM_ANDAMENTO", "EM_REVISAO"];

export class UpdateIdeaUserStory {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  async execute(
    id: string,
    data: UpdateIdeaInputDTO,
    requester: RequesterDTO,
  ): Promise<IdeaOutputDTO> {
    const existingIdea = await this.ideaRepository.findById(id);

    if (!existingIdea) {
      throw new Error("Ideia não encontrada");
    }

    if (existingIdea.authorId !== requester.id) {
      throw new Error("Only the author can edit this idea");
    }

    if (
      existingIdea.currentStage === "LANCAMENTO" ||
      !editableStatuses.includes(existingIdea.status)
    ) {
      throw new Error("Idea can only be edited before triage, between gates or after revision");
    }

    if (data.title !== undefined && data.title.trim().length === 0) {
      throw new Error("Idea title is required");
    }

    const updatedIdea = await this.ideaRepository.update(id, {
      title: data.title,
      description: data.description,
      extraFields: data.extraFields,
    });

    return toIdeaOutputDTO(updatedIdea);
  }
}