import { GateDecisionType } from "../../domain/entities/GateDecision";
import { IdeaStage } from "../../domain/entities/IdeaStage";
import { UserRole } from "../../domain/entities/UserRole";
import { IdeaOutputDTO } from "./IdeaDTO";

export interface DecideGateInputDTO {
  ideaId: string;
  deciderId: string;
  deciderRole: UserRole | undefined;
  decision: unknown;
  feedback: unknown;
  reviewPoints?: unknown;
}

export interface GateDecisionOutputDTO {
  id: string;
  ideaId: string;
  stage: IdeaStage;
  decision: GateDecisionType;
  feedback: string;
  reviewPoints: string[] | null;
  deciderId: string;
  deciderName?: string;
  createdAt: Date;
}

export interface DecideGateOutputDTO {
  decision: GateDecisionOutputDTO;
  idea: IdeaOutputDTO;
}

export interface ListGateDecisionsInputDTO {
  ideaId: string;
  requesterId: string;
  requesterRole: UserRole | undefined;
}
