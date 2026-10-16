import { User } from "../../domain/entities/User";
import { UserRole } from "../../domain/entities/UserRole";
import {
  CreateUserData,
  IUserRepository,
} from "../../domain/repositories/IUserRepository";
import prisma from "../database/prisma/client";
import { Prisma } from "@prisma/client";

export class PrismaUserRepository implements IUserRepository {
  async create(data: CreateUserData): Promise<User> {
    try {
      const raw = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role, // <-- Adicionado aqui para salvar no banco!
        },
      });

      return new User({
        id: raw.id,
        name: raw.name,
        email: raw.email,
        password: raw.password,
        role: raw.role as UserRole,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error("Email is already registered");
      }

      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await prisma.user.findUnique({
      where: { email },
    });

    if (!raw) {
      return null;
    }

    return new User({
      id: raw.id,
      name: raw.name,
      email: raw.email,
      password: raw.password,
      role: raw.role as UserRole,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}