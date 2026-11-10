import { IdeaStage } from "../entities/IdeaStage";
import { IdeaStatus } from "../entities/IdeaStatus";
import { ManualStageTransition } from "../entities/ManualStageTransition";

export interface IManualStageTransitionRepository {
  moveIdea(input: {
    ideaId: string;
    expectedStage: IdeaStage;
    expectedStatus: IdeaStatus;
    toStage: IdeaStage;
    toStatus: IdeaStatus;
    reason: string;
    changedById: string;
  }): Promise<ManualStageTransition>;
  findByIdeaId(ideaId: string): Promise<ManualStageTransition[]>;
  findAll(): Promise<ManualStageTransition[]>;
}
