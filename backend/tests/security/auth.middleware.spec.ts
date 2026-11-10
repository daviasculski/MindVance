jest.mock("../../src/infrastructure/database/prisma/client", () => {
  const { prismaMock } = jest.requireActual("../mocks/prisma.mock");
  return { __esModule: true, default: prismaMock, prisma: prismaMock };
});

import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { ensureAuthenticated } from "../../src/presentation/middlewares/ensureAuthenticated";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.mock";

const secret = "mindvance-test-secret";
const app = express();
app.get("/protected", ensureAuthenticated, (req, res) =>
  res.status(200).json({ user: req.user }),
);

describe("ensureAuthenticated", () => {
  beforeEach(() => {
    resetPrismaMock();
    process.env.JWT_SECRET = secret;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("retorna 401 sem um Bearer token", async () => {
    await request(app).get("/protected").expect(401);
  });

  it.each(["not-a-jwt", `Basic ${jwt.sign({ sub: "user-1" }, secret)}`])(
    "retorna 401 para credenciais malformadas ou inválidas",
    async (authorization) => {
      await request(app)
        .get("/protected")
        .set("Authorization", authorization)
        .expect(401);
    },
  );

  it("retorna 401 para um token expirado", async () => {
    const token = jwt.sign(
      { sub: "user-1", exp: Math.floor(Date.now() / 1000) - 60 },
      secret,
    );

    await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);
  });

  it("retorna 500 se o segredo JWT não estiver configurado", async () => {
    const token = jwt.sign({ sub: "user-1" }, secret);
    delete process.env.JWT_SECRET;
    const error = jest.spyOn(console, "error").mockImplementation(() => undefined);

    await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`)
      .expect(500, { error: "Authentication is not configured" });

  });

  it("rejeita tokens válidos sem um subject de usuário", async () => {
    const token = jwt.sign("not-a-user-payload", secret);

    await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);
  });

  it("rejeita um token cujo usuário não existe", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const token = jwt.sign({ sub: "missing-user" }, secret);

    await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);
  });

  it("aceita um token válido e obtém o papel efetivo do usuário", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Colaborador",
      email: "user@example.com",
      password: "hashed-password",
      role: "GATEKEEPER",
      approvalStatus: "PENDING",
      department: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const token = jwt.sign({ sub: "user-1" }, secret);

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.user).toEqual({
      id: "user-1",
      role: "COLLABORATOR",
    });
  });

  it("retorna 500 quando a consulta do usuário falha", async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error("database unavailable"));
    const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const token = jwt.sign({ sub: "user-1" }, secret);

    await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`)
      .expect(500, { error: "Unable to verify authentication" });

  });
});
