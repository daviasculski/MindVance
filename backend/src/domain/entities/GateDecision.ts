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
  /** Rodada decidida (ausente em decisões anteriores ao modelo de rodadas) */
  reviewId?: string | null;
  /** Estágio em que a ideia estava quando o gate foi decidido */
  stage: IdeaStage;
  /** Estágio de destino; só existe quando a decisão é aprovar */
  toStage?: IdeaStage | null;
  decision: GateDecisionType;
  /** Recomendação do sistema no momento da decisão (D7) */
  recommendation?: GateDecisionType | null;
  consolidatedScore?: number | null;
  feedback: string;
  reviewPoints?: string[] | null;
  deciderId: string;
  createdAt?: Date;
}

/** Transição registrada a cada decisão de gate (stage_transitions). Imutável. */
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

  get reviewId(): string | null {
    return this.props.reviewId ?? null;
  }

  get stage(): IdeaStage {
    return this.props.stage;
  }

  get toStage(): IdeaStage | null {
    return this.props.toStage ?? null;
  }

  get decision(): GateDecisionType {
    return this.props.decision;
  }

  get recommendation(): GateDecisionType | null {
    return this.props.recommendation ?? null;
  }

  get consolidatedScore(): number | null {
    return this.props.consolidatedScore ?? null;
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
