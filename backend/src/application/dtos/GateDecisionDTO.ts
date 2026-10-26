import { GateDecisionType } from "../../domain/entities/GateDecision";
import { IdeaStage } from "../../domain/entities/IdeaStage";
import { UserRole } from "../../domain/entities/UserRole";
import { IdeaOutputDTO } from "./IdeaDTO";

export interface DecideGateInputDTO {
  reviewId: string;
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
  toStage: IdeaStage | null;
  decision: GateDecisionType;
  recommendation: GateDecisionType | null;
  consolidatedScore: number | null;
  /** Rodada e gate decididos (null em decisões anteriores ao modelo de rodadas) */
  round: number | null;
  gateOrder: number | null;
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
