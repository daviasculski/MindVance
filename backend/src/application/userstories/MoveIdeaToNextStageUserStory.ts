import { Idea } from "../../domain/entities/Idea";
import { ideaStages } from "../../domain/entities/IdeaStage";
import { ManualStageTransition } from "../../domain/entities/ManualStageTransition";
import { IdeaStatus } from "../../domain/entities/IdeaStatus";
import { UserRole } from "../../domain/entities/UserRole";
import { IManualStageTransitionRepository } from "../../domain/repositories/IManualStageTransitionRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IdeaOutputDTO, toIdeaOutputDTO } from "../dtos/IdeaDTO";

export interface MoveIdeaToNextStageInput {
  ideaId: string;
  changedById: string;
  changedByRole: UserRole | undefined;
  reason: unknown;
}

export interface MoveIdeaToNextStageOutput {
  idea: IdeaOutputDTO;
  transition: ManualStageTransition;
}

const manuallyMovableStatuses: IdeaStatus[] = [
  "AGUARDANDO_TRIAGEM",
  "EM_ANDAMENTO",
  "EM_REVISAO",
] as const;

export class MoveIdeaToNextStageUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly transitionRepository: IManualStageTransitionRepository,
  ) {}

  async execute(input: MoveIdeaToNextStageInput): Promise<MoveIdeaToNextStageOutput> {
    if (input.changedByRole !== "GATEKEEPER" && input.changedByRole !== "ADMIN") {
      throw new Error("Only gatekeepers and administrators can move ideas manually");
    }

    if (typeof input.reason !== "string" || input.reason.trim().length === 0) {
      throw new Error("A reason is required for a manual stage transition");
    }

    const idea = await this.ideaRepository.findById(input.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    if (!manuallyMovableStatuses.includes(idea.status)) {
      throw new Error("Idea cannot be moved manually in its current status");
    }

    const currentIndex = ideaStages.indexOf(idea.currentStage);
    const toStage = ideaStages[currentIndex + 1];
    if (!toStage) {
      throw new Error("Idea is already in the final stage");
    }
    if (toStage === "LANCAMENTO") {
      throw new Error("Final stage can only be reached by formal gate approval");
    }

    const toStatus = "EM_ANDAMENTO";
    const transition = await this.transitionRepository.moveIdea({
      ideaId: input.ideaId,
      expectedStage: idea.currentStage,
      expectedStatus: idea.status,
      toStage,
      toStatus,
      reason: input.reason.trim(),
      changedById: input.changedById,
    });

    const updatedIdea = new Idea({
      ...idea.toJSON(),
      currentStage: toStage,
      status: toStatus,
    });

    return {
      idea: toIdeaOutputDTO(updatedIdea),
      transition,
    };
  }
}
