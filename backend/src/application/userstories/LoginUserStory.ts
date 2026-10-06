import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { LoginInputDTO, LoginOutputDTO } from "../dtos/LoginDTO";

export class LoginUserStory {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: LoginInputDTO): Promise<LoginOutputDTO> {
    if (
      typeof input.email !== "string" ||
      input.email.trim().length === 0 ||
      typeof input.password !== "string" ||
      input.password.length === 0
    ) {
      throw new Error("Invalid credentials");
    }

    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password);

    if (!passwordMatches) {
      throw new Error("Invalid credentials");
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign({}, secret, {
      subject: user.id,
      expiresIn: "1d",
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
