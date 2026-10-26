import { IdeaStatus } from "../../domain/entities/IdeaStatus";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";

const editableStatuses: IdeaStatus[] = ["AGUARDANDO_TRIAGEM", "EM_ANDAMENTO", "EM_REVISAO"];
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

    // O autor edita e produz as entregas fora do gate: antes da triagem, no
    // trabalho do estágio e em Revisar. Dentro do gate o conteúdo fica congelado
    // para todos os avaliadores avaliarem a mesma versão (P4).
    if (!editableStatuses.includes(existingIdea.status)) {
      throw new Error("Idea cannot be edited while in a gate or after it was closed");
    }

    if (data.title !== undefined && data.title.trim().length === 0) {
      throw new Error("Idea title is required");
    }

    // Editar não reenvia a ideia: o reenvio é pelo "Solicitar revisão do gate"
    const updatedIdea = await this.ideaRepository.update(id, {
      title: data.title,
      description: data.description,
      extraFields: data.extraFields,
    });

    return toIdeaOutputDTO(updatedIdea);
  }
}
