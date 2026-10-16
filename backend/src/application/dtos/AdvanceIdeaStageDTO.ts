import { IdeaStage } from "../../domain/entities/IdeaStage";

export interface AdvanceIdeaStageOutputDTO {
  id: string;
  currentStage: IdeaStage;
}
