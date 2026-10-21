import { IdeaStage } from "./IdeaStage";

export const gateDecisionTypes = ["APROVADA", "REJEITADA", "REVISAO"] as const;

export type GateDecisionType = (typeof gateDecisionTypes)[number];

export function isGateDecisionType(value: unknown): value is GateDecisionType {
  return (
    typeof value === "string" &&
    gateDecisionTypes.some((type) => type === value)
  );
}

export interface GateDecisionProps {
  id?: string;
  ideaId: string;
  /** Estágio em que a ideia estava quando o gate foi decidido */
  stage: IdeaStage;
  decision: GateDecisionType;
  feedback: string;
  reviewPoints?: string[] | null;
  deciderId: string;
  createdAt?: Date;
}

export class GateDecision {
  private readonly props: GateDecisionProps;

  constructor(props: GateDecisionProps) {
    this.props = {
      ...props,
      createdAt: props.createdAt ?? new Date(),
    };
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get ideaId(): string {
    return this.props.ideaId;
  }

  get stage(): IdeaStage {
    return this.props.stage;
  }

  get decision(): GateDecisionType {
    return this.props.decision;
  }

  get feedback(): string {
    return this.props.feedback;
  }

  get reviewPoints(): string[] | null {
    return this.props.reviewPoints ?? null;
  }

  get deciderId(): string {
    return this.props.deciderId;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }
}
