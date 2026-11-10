import { IManualStageTransitionRepository } from "../../domain/repositories/IManualStageTransitionRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

export interface ManualStageTransitionDTO {
  id: string;
  ideaId: string;
  fromStage: string;
  toStage: string;
  reason: string;
  changedById: string;
  changedByName: string;
  createdAt: Date;
}

export class ListManualStageTransitionsUserStory {
  constructor(
    private readonly transitionRepository: IManualStageTransitionRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(ideaId: string): Promise<ManualStageTransitionDTO[]> {
    const transitions = await this.transitionRepository.findByIdeaId(ideaId);
    const users = await this.userRepository.findByIds([
      ...new Set(transitions.map((transition) => transition.changedById)),
    ]);
    const names = new Map(users.map((user) => [user.id, user.name]));

    return transitions.map((transition) => ({
      id: transition.id!,
      ideaId: transition.ideaId,
      fromStage: transition.fromStage,
      toStage: transition.toStage,
      reason: transition.reason,
      changedById: transition.changedById,
      changedByName: names.get(transition.changedById) ?? "Gestor",
      createdAt: transition.createdAt!,
    }));
  }
}
