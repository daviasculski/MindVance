import { User, UserApprovalStatus } from "../entities/User";
import { UserRole } from "../entities/UserRole"; // Ajuste o caminho se necessário

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: UserRole; // <-- Adicionado aqui
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findPendingApprovals(): Promise<User[]>;
  updateApprovalStatus(id: string, status: UserApprovalStatus): Promise<User>;
}