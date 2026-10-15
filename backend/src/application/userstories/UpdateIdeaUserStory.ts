import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import {
  IdeaOutputDTO,
  RequesterDTO,
  UpdateIdeaInputDTO,
  toIdeaOutputDTO,
} from "../dtos/IdeaDTO";

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

    // Editável na Ideação, ou em qualquer estágio quando o gate pediu revisão
    const inRevision = existingIdea.status === "EM_REVISAO";
    const editable =
      inRevision ||
      (existingIdea.currentStage === "IDEACAO" &&
        existingIdea.status === "EM_ANDAMENTO");

    if (!editable) {
      throw new Error(
        "Idea can only be edited during Ideation or when returned for revision",
      );
    }

    if (data.title !== undefined && data.title.trim().length === 0) {
      throw new Error("Idea title is required");
    }

    let updatedIdea = await this.ideaRepository.update(id, {
      title: data.title,
      description: data.description,
      extraFields: data.extraFields,
    });

    // Ajustes feitos após um pedido de revisão reenviam a ideia ao gate
    if (inRevision) {
      updatedIdea = await this.ideaRepository.updateProgress(id, {
        status: "EM_ANDAMENTO",
      });
    }

    return toIdeaOutputDTO(updatedIdea);
  }
}
