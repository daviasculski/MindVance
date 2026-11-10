jest.mock("../../src/infrastructure/database/prisma/client", () => {
  const { prismaMock } = jest.requireActual("../mocks/prisma.mock");
  return { __esModule: true, default: prismaMock, prisma: prismaMock };
});

import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { ensureAdminRole } from "../../src/presentation/middlewares/ensureAdminRole";
import { ensureAuthenticated } from "../../src/presentation/middlewares/ensureAuthenticated";
import { ensureRole } from "../../src/presentation/middlewares/ensureRole";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.mock";

const app = express();
app.get(
  "/gate/decision",
  ensureAuthenticated,
  ensureRole("GATEKEEPER"),
  (_req, res) => res.sendStatus(204),
);
app.get(
  "/users/approvals",
  ensureAuthenticated,
  ensureAdminRole,
  (_req, res) => res.sendStatus(204),
);

const tokenFor = (id: string) =>
  jwt.sign({ sub: id }, process.env.JWT_SECRET ?? "mindvance-test-secret");

describe("role-based access control", () => {
  beforeEach(() => {
    resetPrismaMock();
    process.env.JWT_SECRET = "mindvance-test-secret";
    prismaMock.user.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        Promise.resolve({
          id: where.id,
          name: where.id,
          email: `${where.id}@example.com`,
          password: "hashed-password",
          role: where.id,
          approvalStatus: "APPROVED",
          department: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
    );
  });

  it.each(["COLLABORATOR", "EVALUATOR"])(
    "returns 403 to %s for gate decisions and pending-account approvals",
    async (role) => {
      const token = tokenFor(role);

      await request(app)
        .get("/gate/decision")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
      await request(app)
        .get("/users/approvals")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    },
  );

  it("allows only the configured role on each protected resource", async () => {
    await request(app)
      .get("/gate/decision")
      .set("Authorization", `Bearer ${tokenFor("GATEKEEPER")}`)
      .expect(204);
    await request(app)
      .get("/users/approvals")
      .set("Authorization", `Bearer ${tokenFor("ADMIN")}`)
      .expect(204);
  });
});
