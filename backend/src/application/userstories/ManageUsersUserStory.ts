import { User } from "../../domain/entities/User";
import { isUserRole } from "../../domain/entities/UserRole";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { RequesterDTO } from "../dtos/IdeaDTO";

export interface UserSummaryDTO {
  id: string;
  name: string;
  email: string;
  /** Papel pedido ou atribuído */
  role: string;
  approvalStatus: string;
  /** Papel com que o usuário opera hoje */
  effectiveRole: string;
  createdAt: Date;
}

function toSummary(user: User): UserSummaryDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    approvalStatus: user.approvalStatus,
    effectiveRole: user.effectiveRole,
    createdAt: user.createdAt,
  };
}

/** Gestão de usuários pelo Administrador (ADM-01/02) e lista de avaliadores para o Gestor. */
export class ManageUsersUserStory {
  constructor(private readonly userRepository: IUserRepository) {}

  async listAll(): Promise<UserSummaryDTO[]> {
    return (await this.userRepository.findAll()).map(toSummary);
  }

  async changeRole(userId: string, role: unknown, requester: RequesterDTO): Promise<UserSummaryDTO> {
    if (!isUserRole(role)) {
      throw new Error("Invalid user role");
    }
    if (userId === requester.id) {
      throw new Error("Administrators cannot change their own role");
    }
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return toSummary(await this.userRepository.updateRole(userId, role));
  }

  /** Avaliadores aprovados, para a designação de um gate */
  async listEvaluators(): Promise<{ id: string; name: string; email: string }[]> {
    return (await this.userRepository.findAll())
      .filter((u) => u.effectiveRole === "EVALUATOR")
      .map((u) => ({ id: u.id, name: u.name, email: u.email }));
  }
}
