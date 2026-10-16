import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IEvaluationRepository } from "../../domain/repositories/IEvaluationRepository";
import {
  IdeaStage,
  isIdeaStage,
} from "../../domain/entities/IdeaStage";
import { AdvanceIdeaStageOutputDTO } from "../dtos/AdvanceIdeaStageDTO";

export class AdvanceIdeaStageUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly evaluationRepository: IEvaluationRepository,
  ) {}

  async execute(
    ideaId: string,
    newStage: IdeaStage,
  ): Promise<AdvanceIdeaStageOutputDTO> {
    const idea = await this.ideaRepository.findById(ideaId);

    if (!idea) {
      throw new Error("Idea not found");
    }

    if (!isIdeaStage(newStage)) {
      throw new Error("Invalid idea stage");
    }

    const evaluations = await this.evaluationRepository.findByIdeaId(ideaId);
    if (evaluations.length === 0) {
      throw new Error("Cannot advance idea with pending evaluations");
    }

    const updatedIdea = await this.ideaRepository.updateStage(ideaId, newStage);

    return {
      id: updatedIdea.id!,
      currentStage: updatedIdea.currentStage,
    };
  }
}
