import { User, UserApprovalStatus } from "../../domain/entities/User";
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
          approvalStatus:
            data.role === "EVALUATOR" || data.role === "GATEKEEPER"
              ? "PENDING"
              : "APPROVED",
        },
      });

      return new User({
        id: raw.id,
        name: raw.name,
        email: raw.email,
        password: raw.password,
        role: raw.role as UserRole,
        approvalStatus: raw.approvalStatus as UserApprovalStatus,
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

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }

    const list = await prisma.user.findMany({
      where: { id: { in: ids } },
    });

    return list.map(
      (raw) =>
        new User({
          id: raw.id,
          name: raw.name,
          email: raw.email,
          password: raw.password,
          role: raw.role as UserRole,
          approvalStatus: raw.approvalStatus as UserApprovalStatus,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        }),
    );
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
      approvalStatus: raw.approvalStatus as UserApprovalStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findById(id: string): Promise<User | null> {
    const raw = await prisma.user.findUnique({ where: { id } });
    if (!raw) return null;
    return new User({
      id: raw.id,
      name: raw.name,
      email: raw.email,
      password: raw.password,
      role: raw.role as UserRole,
      approvalStatus: raw.approvalStatus as UserApprovalStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findPendingApprovals(): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { approvalStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
    return users.map(
      (raw) =>
        new User({
          id: raw.id,
          name: raw.name,
          email: raw.email,
          password: raw.password,
          role: raw.role as UserRole,
          approvalStatus: raw.approvalStatus as UserApprovalStatus,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        }),
    );
  }

  async updateApprovalStatus(
    id: string,
    status: UserApprovalStatus,
  ): Promise<User> {
    const result = await prisma.user.updateMany({
      where: { id, approvalStatus: "PENDING" },
      data: { approvalStatus: status },
    });
    if (result.count === 0) {
      const existing = await this.findById(id);
      throw new Error(
        existing
          ? "User does not have a pending approval request"
          : "User not found",
      );
    }
    const raw = await prisma.user.findUniqueOrThrow({ where: { id } });
    return new User({
      id: raw.id,
      name: raw.name,
      email: raw.email,
      password: raw.password,
      role: raw.role as UserRole,
      approvalStatus: raw.approvalStatus as UserApprovalStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}