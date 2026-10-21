export interface CreateUserInputDTO {
  name: string;
  email: string;
  password: string;
  role?: "COLLABORATOR" | "EVALUATOR" | "GATEKEEPER" | "ADMIN";
}

export interface CreateUserOutputDTO {
  id: string;
  name: string;
  email: string;
  role: string; // Adicionado para retornar o papel criado
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
}