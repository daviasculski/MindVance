jest.mock("../../src/infrastructure/database/prisma/client", () => {
  const { prismaMock } = jest.requireActual("../mocks/prisma.mock");
  return { __esModule: true, default: prismaMock, prisma: prismaMock };
});
jest.mock("../../src/presentation/dependencies", () => ({
  notifier: {
    accountApprovalDecided: jest.fn(),
  },
  emailService: {},
}));

import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../../src/app";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.mock";

describe("pending user approval routes", () => {
  const users = new Map<string, Record<string, unknown>>();
  const adminId = "admin-1";
  const pendingId = "pending-1";
  const token = () =>
    jwt.sign({ sub: adminId }, process.env.JWT_SECRET ?? "mindvance-test-secret");

  beforeEach(() => {
    resetPrismaMock();
    users.clear();
    const timestamp = new Date();
    users.set(adminId, {
      id: adminId,
      name: "Administrator",
      email: "admin@example.com",
      password: "hashed-password",
      role: "ADMIN",
      approvalStatus: "APPROVED",
      department: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    users.set(pendingId, {
      id: pendingId,
      name: "Avaliadora",
      email: "evaluator@example.com",
      password: "hashed-password",
      role: "EVALUATOR",
      approvalStatus: "PENDING",
      department: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    prismaMock.user.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        Promise.resolve(users.get(where.id) ?? null),
    );
    prismaMock.user.findMany.mockImplementation(
      ({ where }: { where?: { approvalStatus?: string } } = {}) =>
        Promise.resolve(
          [...users.values()].filter(
            (user) =>
              !where?.approvalStatus ||
              user.approvalStatus === where.approvalStatus,
          ),
        ),
    );
    prismaMock.user.updateMany.mockImplementation(
      ({ where, data }: {
        where: { id: string; approvalStatus: string };
        data: { approvalStatus: string };
      }) => {
        const user = users.get(where.id);
        if (!user || user.approvalStatus !== where.approvalStatus) {
          return Promise.resolve({ count: 0 });
        }
        users.set(where.id, { ...user, approvalStatus: data.approvalStatus });
        return Promise.resolve({ count: 1 });
      },
    );
    prismaMock.user.findUniqueOrThrow.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        const user = users.get(where.id);
        if (!user) throw new Error("User not found");
        return Promise.resolve(user);
      },
    );
  });

  it("lists pending requests and updates a user's approval status", async () => {
    const authorization = `Bearer ${token()}`;

    const pending = await request(app)
      .get("/api/users/approvals/pending")
      .set("Authorization", authorization)
      .expect(200);
    expect(pending.body).toHaveLength(1);
    expect(pending.body[0]).toMatchObject({
      id: pendingId,
      role: "EVALUATOR",
      approvalStatus: "PENDING",
    });

    const decision = await request(app)
      .patch(`/api/users/${pendingId}/approval`)
      .set("Authorization", authorization)
      .send({ status: "APPROVED" })
      .expect(200);
    expect(decision.body).toMatchObject({
      id: pendingId,
      approvalStatus: "APPROVED",
    });
    expect(users.get(pendingId)?.approvalStatus).toBe("APPROVED");
  });

  it("denies account approval requests from non-administrator roles", async () => {
    users.set("collaborator-1", {
      id: "collaborator-1",
      name: "Colaborador",
      email: "collaborator@example.com",
      password: "hashed-password",
      role: "COLLABORATOR",
      approvalStatus: "APPROVED",
      department: "Operações",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const collaboratorToken = jwt.sign(
      { sub: "collaborator-1" },
      process.env.JWT_SECRET ?? "mindvance-test-secret",
    );

    await request(app)
      .get("/api/users/approvals/pending")
      .set("Authorization", `Bearer ${collaboratorToken}`)
      .expect(403);
  });
});
