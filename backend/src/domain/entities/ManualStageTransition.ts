import { IdeaStage } from "./IdeaStage";

export interface ManualStageTransition {
  id?: string;
  ideaId: string;
  fromStage: IdeaStage;
  toStage: IdeaStage;
  reason: string;
  changedById: string;
  createdAt?: Date;
}
