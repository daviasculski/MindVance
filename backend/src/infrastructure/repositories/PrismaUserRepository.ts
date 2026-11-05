import { User, UserApprovalStatus } from "../../domain/entities/User";
import { UserRole } from "../../domain/entities/UserRole";
import {
  CreateUserData,
  IUserRepository,
} from "../../domain/repositories/IUserRepository";
import prisma from "../database/prisma/client";
import { Prisma, User as PrismaUser } from "@prisma/client";

function toUser(raw: PrismaUser): User {
  return new User({
    id: raw.id,
    name: raw.name,
    email: raw.email,
    password: raw.password,
    role: raw.role as UserRole,
    approvalStatus: raw.approvalStatus as UserApprovalStatus,
    department: raw.department,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}

export class PrismaUserRepository implements IUserRepository {
  async create(data: CreateUserData): Promise<User> {
    try {
      const raw = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          department: data.department ?? null,
          approvalStatus:
            data.role === "EVALUATOR" || data.role === "GATEKEEPER"
              ? "PENDING"
              : "APPROVED",
        },
      });

      return toUser(raw);
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

    return list.map(toUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await prisma.user.findUnique({
      where: { email },
    });

    return raw ? toUser(raw) : null;
  }

  async findById(id: string): Promise<User | null> {
    const raw = await prisma.user.findUnique({ where: { id } });
    return raw ? toUser(raw) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
    return users.map(toUser);
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const raw = await prisma.user.update({
      where: { id },
      data: { role, approvalStatus: "APPROVED" },
    });
    return toUser(raw);
  }

  async findPendingApprovals(): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { approvalStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
    return users.map(toUser);
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
    return toUser(raw);
  }
}
