export interface CreateUserInputDTO {
  name: string;
  email: string;
  password: string;
  role?: "COLLABORATOR" | "EVALUATOR" | "GATEKEEPER" | "ADMIN";
  /** Obrigatório para Colaborador; ignorado nos demais papéis */
  department?: string;
}

export interface CreateUserOutputDTO {
  id: string;
  name: string;
  email: string;
  role: string; // Adicionado para retornar o papel criado
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  department: string | null;
  createdAt: Date;
  updatedAt: Date;
}