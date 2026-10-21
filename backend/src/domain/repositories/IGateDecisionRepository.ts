import { GateDecision } from "../entities/GateDecision";

export interface IGateDecisionRepository {
  create(decision: GateDecision): Promise<GateDecision>;
  findByIdeaId(ideaId: string): Promise<GateDecision[]>;
}
