import { IdeaStage } from "./IdeaStage";

export interface IdeaProps {
  id?: string;
  title: string;
  description: string;
  authorId: string;
  extraFields?: Record<string, unknown> | null;
  currentStage?: IdeaStage;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Idea {
  private props: IdeaProps;

  constructor(props: IdeaProps) {
    this.props = {
      ...props,
      extraFields: props.extraFields ?? {},
      currentStage: props.currentStage ?? "IDEATION",
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
    return this.props.currentStage ?? "IDEATION";
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
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
