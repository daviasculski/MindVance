export interface EvaluationProps {
  id?: string;
  ideaId: string;
  evaluatorId: string;
  score: number;
  justification: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Evaluation {
  private readonly props: EvaluationProps;

  constructor(props: EvaluationProps) {
    this.props = {
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get ideaId(): string {
    return this.props.ideaId;
  }

  get evaluatorId(): string {
    return this.props.evaluatorId;
  }

  get score(): number {
    return this.props.score;
  }

  get justification(): string {
    return this.props.justification;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  toJSON() {
    return {
      id: this.id,
      ideaId: this.ideaId,
      evaluatorId: this.evaluatorId,
      score: this.score,
      justification: this.justification,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
