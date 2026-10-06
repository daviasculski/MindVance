export interface CreateUserInputDTO {
  name: string;
  email: string;
  password: string;
}

export interface CreateUserOutputDTO {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
