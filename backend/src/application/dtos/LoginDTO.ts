import { UserApprovalStatus } from "../../domain/entities/User";
import { UserRole } from "../../domain/entities/UserRole";

export interface LoginInputDTO {
  email: string;
  password: string;
}

export interface LoginOutputDTO {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    approvalStatus: UserApprovalStatus;
    createdAt: Date;
    updatedAt: Date;
  };
}
