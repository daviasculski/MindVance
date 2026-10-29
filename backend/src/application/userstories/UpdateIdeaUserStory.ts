import { IdeaStatus } from "../../domain/entities/IdeaStatus";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
<<<<<<< HEAD

const editableStatuses: IdeaStatus[] = ["AGUARDANDO_TRIAGEM", "EM_ANDAMENTO", "EM_REVISAO"];
=======
import { IEvaluationRepository } from "../../domain/repositories/IEvaluationRepository";

const editableStatuses: IdeaStatus[] = ["AGUARDANDO_TRIAGEM"];
>>>>>>> feature/editar-cancelar-ideia
import {
  IdeaOutputDTO,
  RequesterDTO,
  UpdateIdeaInputDTO,
  toIdeaOutputDTO,
} from "../dtos/IdeaDTO";

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

<<<<<<< HEAD
    // O autor edita e produz as entregas fora do gate: antes da triagem, no
    // trabalho do estágio e em Revisar. Dentro do gate o conteúdo fica congelado
    // para todos os avaliadores avaliarem a mesma versão (P4).
    if (!editableStatuses.includes(existingIdea.status)) {
      throw new Error("Idea cannot be edited while in a gate or after it was closed");
=======
    if (
      existingIdea.currentStage !== "IDEACAO" ||
      !editableStatuses.includes(existingIdea.status)
    ) {
      throw new Error("Idea can only be edited while awaiting initial triage");
    }

    const evaluations = await this.evaluationRepository.findByIdeaId(id);
    if (evaluations.length > 0) {
      throw new Error("Idea cannot be edited after evaluations have been registered");
>>>>>>> feature/editar-cancelar-ideia
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
