import { UserRole } from "./UserRole";

export type UserApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface UserProps {
  id: string;
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  approvalStatus?: UserApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private readonly props: UserProps;

  constructor(props: UserProps) {
    this.props = {
      ...props,
      role: props.role ?? "COLLABORATOR",
      approvalStatus: props.approvalStatus ?? "APPROVED",
    };
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get password(): string {
    return this.props.password;
  }

  get role(): UserRole {
    return this.props.role ?? "COLLABORATOR";
  }

  get approvalStatus(): UserApprovalStatus {
    return this.props.approvalStatus ?? "APPROVED";
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}