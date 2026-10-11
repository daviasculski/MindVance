import bcrypt from "bcryptjs";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import {
  CreateUserInputDTO,
  CreateUserOutputDTO,
} from "../dtos/CreateUserDTO";

export class CreateUserUserStory {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: CreateUserInputDTO): Promise<CreateUserOutputDTO> {
    if (
      typeof input.name !== "string" ||
      input.name.trim().length === 0 ||
      typeof input.email !== "string" ||
      input.email.trim().length === 0 ||
      typeof input.password !== "string" ||
      input.password.length === 0
    ) {
      throw new Error("Name, email, and password are required");
    }

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const role = input.role; // <-- Captura o role enviado

    if (await this.userRepository.findByEmail(email)) {
      throw new Error("Email is already registered");
    }

    const password = await bcrypt.hash(input.password, 8);
    // Passa o role para o repositório criar a entidade com o perfil correto
    const user = await this.userRepository.create({ name, email, password, role });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role, // <-- Opcional, mas útil para retornar no output DTO
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}