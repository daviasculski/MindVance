import { IdeaStage } from "./IdeaStage";

export interface EvaluationCriterion {
  name: string;
  weight: number;
  score: number;
  comment?: string;
}

export interface EvaluationProps {
  id?: string;
  ideaId: string;
  evaluatorId: string;
  score: number;
  justification: string;
  stage: IdeaStage;
  criteria?: EvaluationCriterion[] | null;
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

  get stage(): IdeaStage {
    return this.props.stage;
  }

  get criteria(): EvaluationCriterion[] | null {
    return this.props.criteria ?? null;
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
      stage: this.stage,
      criteria: this.criteria,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
