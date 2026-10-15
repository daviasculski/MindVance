import { IdeaStage } from "./IdeaStage";
import { IdeaStatus } from "./IdeaStatus";

export interface IdeaProps {
  id?: string;
  title: string;
  description: string;
  authorId: string;
  extraFields?: Record<string, unknown> | null;
  currentStage?: IdeaStage;
  status?: IdeaStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Idea {
  private props: IdeaProps;

  constructor(props: IdeaProps) {
    this.props = {
      ...props,
      extraFields: props.extraFields ?? {},
      currentStage: props.currentStage ?? "IDEACAO",
      status: props.status ?? "EM_ANDAMENTO",
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get authorId(): string {
    return this.props.authorId;
  }

  get extraFields(): Record<string, unknown> | null | undefined {
    return this.props.extraFields;
  }

  get currentStage(): IdeaStage {
    return this.props.currentStage ?? "IDEACAO";
  }

  get status(): IdeaStatus {
    return this.props.status ?? "EM_ANDAMENTO";
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  public toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      authorId: this.authorId,
      extraFields: this.extraFields,
      currentStage: this.currentStage,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
