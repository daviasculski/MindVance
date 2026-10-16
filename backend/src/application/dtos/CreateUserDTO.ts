export interface CreateUserInputDTO {
  name: string;
  email: string;
  password: string;
  role?: 'COLLABORATOR' | 'EVALUATOR' | 'ADMIN';
}

export interface CreateUserOutputDTO {
  id: string;
  name: string;
  email: string;
  role: string; // Adicionado para retornar o papel criado
  createdAt: Date;
  updatedAt: Date;
}