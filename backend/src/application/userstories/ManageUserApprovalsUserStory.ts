import { User, UserApprovalStatus } from "../../domain/entities/User";
import { UserRole } from "../../domain/entities/UserRole";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

interface UserApprovalSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  approvalStatus: UserApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class ManageUserApprovalsUserStory {
  constructor(private readonly userRepository: IUserRepository) {}

  async listPending(): Promise<UserApprovalSummary[]> {
    const users = await this.userRepository.findPendingApprovals();
    return users.map((user) => this.toSummary(user));
  }

  async decide(
    userId: string,
    status: unknown,
  ): Promise<Omit<UserApprovalSummary, "createdAt" | "updatedAt">> {
    if (status !== "APPROVED" && status !== "REJECTED") {
      throw new Error("Approval status must be APPROVED or REJECTED");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (user.approvalStatus !== "PENDING") {
      throw new Error("User does not have a pending approval request");
    }

    const updatedUser = await this.userRepository.updateApprovalStatus(
      userId,
      status,
    );
    const { createdAt: _createdAt, updatedAt: _updatedAt, ...summary } =
      this.toSummary(updatedUser);
    return summary;
  }

  private toSummary(user: User): UserApprovalSummary {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
