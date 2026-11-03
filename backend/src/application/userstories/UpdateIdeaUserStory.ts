import { IdeaStatus } from "../../domain/entities/IdeaStatus";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IEvaluationRepository } from "../../domain/repositories/IEvaluationRepository";
import {
  IdeaOutputDTO,
  RequesterDTO,
  UpdateIdeaInputDTO,
  toIdeaOutputDTO,
} from "../dtos/IdeaDTO";

const editableStatuses: IdeaStatus[] = ["AGUARDANDO_TRIAGEM"];

export class UpdateIdeaUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly evaluationRepository: IEvaluationRepository,
  ) {}

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
      existingIdea.currentStage !== "IDEACAO" ||
      !editableStatuses.includes(existingIdea.status)
    ) {
      throw new Error("Idea can only be edited while awaiting initial triage");
    }

    const evaluations = await this.evaluationRepository.findByIdeaId(id);
    if (evaluations.length > 0) {
      throw new Error("Idea cannot be edited after evaluations have been registered");
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