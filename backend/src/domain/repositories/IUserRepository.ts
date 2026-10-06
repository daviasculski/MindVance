import { User } from "../entities/User";

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
}
