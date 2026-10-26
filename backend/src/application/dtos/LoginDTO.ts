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
    /** Papel com que o usuário opera (Colaborador enquanto o pedido não é aprovado) */
    role: UserRole;
    /** Papel pedido no cadastro ou atribuído pelo Administrador */
    requestedRole: UserRole;
    approvalStatus: UserApprovalStatus;
    createdAt: Date;
    updatedAt: Date;
  };
}
