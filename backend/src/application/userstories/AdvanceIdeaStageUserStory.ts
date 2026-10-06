import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import {
  IdeaStage,
  isIdeaStage,
} from "../../domain/entities/IdeaStage";
import { AdvanceIdeaStageOutputDTO } from "../dtos/AdvanceIdeaStageDTO";

export class AdvanceIdeaStageUserStory {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

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

    // Gate approval is not modeled yet, so stage advancement fails closed.
    const isGateApproved = false;

    if (!isGateApproved) {
      throw new Error("Cannot advance idea with pending evaluations");
    }

    const updatedIdea = await this.ideaRepository.updateStage(ideaId, newStage);

    return {
      id: updatedIdea.id!,
      currentStage: updatedIdea.currentStage,
    };
  }
}
