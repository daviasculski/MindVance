jest.mock("../../src/infrastructure/database/prisma/client", () => {
  const { prismaMock } = jest.requireActual("../mocks/prisma.mock");
  return { __esModule: true, default: prismaMock, prisma: prismaMock };
});
jest.mock("../../src/presentation/dependencies", () => ({
  notifier: {
    ideaSubmitted: jest.fn().mockResolvedValue(undefined),
    accountApprovalDecided: jest.fn(),
  },
  emailService: {},
}));

import fs from "fs";
import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../../src/app";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.mock";

interface StoredIdea {
  id: string;
  title: string;
  description: string;
  author_id: string;
  extra_fields: Record<string, unknown>;
  current_stage: string;
  status: string;
  cancelled_at: Date | null;
  cancelled_by_id: string | null;
  cancellation_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

interface StoredAttachment {
  id: string;
  ideaId: string;
  uploadedById: string;
  stage: string;
  fileName: string;
  storedName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

interface StoredStageTransition {
  id: string;
  ideaId: string;
  fromStage: string;
  toStage: string;
  reason: string;
  changedById: string;
  createdAt: Date;
}

describe("ideas REST integration", () => {
  const userRows = new Map<string, Record<string, unknown>>();
  const ideaRows = new Map<string, StoredIdea>();
  const attachmentRows = new Map<string, StoredAttachment>();
  const stageTransitionRows = new Map<string, StoredStageTransition>();
  const authorId = "author-1";
  const ideaId = "idea-1";

  const token = (userId = authorId) =>
    jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? "mindvance-test-secret");
  const ideaRow = (): StoredIdea => ({
    id: ideaId,
    title: "Automatizar o atendimento",
    description: "Criar um fluxo de triagem automatizado",
    author_id: authorId,
    extra_fields: {
      problem: "Processo manual",
      department: "Operações",
    },
    current_stage: "IDEACAO",
    status: "AGUARDANDO_TRIAGEM",
    cancelled_at: null,
    cancelled_by_id: null,
    cancellation_reason: null,
    created_at: new Date(),
    updated_at: new Date(),
  });

  beforeEach(() => {
    resetPrismaMock();
    userRows.clear();
    ideaRows.clear();
    attachmentRows.clear();
    stageTransitionRows.clear();

    const author = {
      id: authorId,
      name: "Autora",
      email: "author@example.com",
      password: "hashed-password",
      role: "COLLABORATOR",
      approvalStatus: "APPROVED",
      department: "Operações",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    userRows.set(authorId, author);
    userRows.set("manager-1", {
      id: "manager-1",
      name: "Gestor",
      email: "manager@example.com",
      password: "hashed-password",
      role: "GATEKEEPER",
      approvalStatus: "APPROVED",
      department: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    userRows.set("admin-1", {
      id: "admin-1",
      name: "Administradora",
      email: "admin@example.com",
      password: "hashed-password",
      role: "ADMIN",
      approvalStatus: "APPROVED",
      department: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.user.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        Promise.resolve(userRows.get(where.id) ?? null),
    );
    prismaMock.user.findMany.mockImplementation(() =>
      Promise.resolve([...userRows.values()]),
    );

    prismaMock.idea.create.mockImplementation(
      ({ data }: { data: Omit<StoredIdea, "created_at" | "updated_at" | "current_stage" | "cancelled_at" | "cancelled_by_id" | "cancellation_reason"> }) => {
        const row: StoredIdea = {
          ...data,
          id: ideaId,
          current_stage: "IDEACAO",
          status: "AGUARDANDO_TRIAGEM",
          cancelled_at: null,
          cancelled_by_id: null,
          cancellation_reason: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        ideaRows.set(row.id, row);
        return Promise.resolve(row);
      },
    );
    prismaMock.idea.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        Promise.resolve(ideaRows.get(where.id) ?? null),
    );
    prismaMock.idea.findMany.mockImplementation(() =>
      Promise.resolve([...ideaRows.values()]),
    );
    prismaMock.idea.updateMany.mockImplementation(
      ({ where, data }: {
        where: { id: string; current_stage: string; status: string };
        data: { current_stage: string; status: string };
      }) => {
        const row = ideaRows.get(where.id);
        if (
          !row ||
          row.current_stage !== where.current_stage ||
          row.status !== where.status
        ) {
          return Promise.resolve({ count: 0 });
        }
        ideaRows.set(where.id, {
          ...row,
          current_stage: data.current_stage,
          status: data.status,
          updated_at: new Date(),
        });
        return Promise.resolve({ count: 1 });
      },
    );

    prismaMock.gateReview.findMany.mockResolvedValue([]);
    prismaMock.gateDecision.findMany.mockResolvedValue([]);
    prismaMock.manualStageTransition.create.mockImplementation(
      ({ data }: { data: Omit<StoredStageTransition, "id" | "createdAt"> }) => {
        const row: StoredStageTransition = {
          ...data,
          id: `transition-${stageTransitionRows.size + 1}`,
          createdAt: new Date(),
        };
        stageTransitionRows.set(row.id, row);
        return Promise.resolve(row);
      },
    );
    prismaMock.manualStageTransition.findMany.mockImplementation(
      ({ where }: { where?: { ideaId?: string } } = {}) =>
        Promise.resolve(
          [...stageTransitionRows.values()].filter(
            (transition) => !where?.ideaId || transition.ideaId === where.ideaId,
          ),
        ),
    );
    prismaMock.attachment.create.mockImplementation(
      ({ data }: { data: Omit<StoredAttachment, "id" | "createdAt"> }) => {
        const row: StoredAttachment = {
          ...data,
          id: `attachment-${attachmentRows.size + 1}`,
          createdAt: new Date(),
        };
        attachmentRows.set(row.id, row);
        return Promise.resolve(row);
      },
    );
    prismaMock.attachment.findMany.mockImplementation(() =>
      Promise.resolve([...attachmentRows.values()]),
    );
    prismaMock.attachment.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        Promise.resolve(attachmentRows.get(where.id) ?? null),
    );
  });

  afterAll(() => {
    const uploadDir = process.env.UPLOAD_DIR;
    if (uploadDir && fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }
  });

  it("creates and lists an idea, then uploads, lists, and downloads its attachment", async () => {
    const authorization = `Bearer ${token()}`;
    const created = await request(app)
      .post("/api/ideas")
      .set("Authorization", authorization)
      .send({
        title: "Automatizar o atendimento",
        description: "Criar um fluxo de triagem automatizado",
        extraFields: {
          problem: "Processo manual",
          department: "Operações",
        },
      })
      .expect(201);

    expect(created.body.id).toBe(ideaId);
    expect(created.body.extraFields.problem).toBe("Processo manual");

    const listed = await request(app)
      .get(`/api/ideas?authorId=${authorId}`)
      .set("Authorization", authorization)
      .expect(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].title).toBe("Automatizar o atendimento");

    const uploaded = await request(app)
      .post(`/api/ideas/${ideaId}/attachments`)
      .set("Authorization", authorization)
      .attach("files", Buffer.from("conteudo do anexo"), {
        filename: "proposta.txt",
        contentType: "text/plain",
      })
      .expect(201);
    expect(uploaded.body).toHaveLength(1);
    expect(uploaded.body[0].fileName).toBe("proposta.txt");

    const attachmentId = uploaded.body[0].id as string;
    const listedAttachments = await request(app)
      .get(`/api/ideas/${ideaId}/attachments`)
      .set("Authorization", authorization)
      .expect(200);
    expect(listedAttachments.body[0]).toMatchObject({
      id: attachmentId,
      fileName: "proposta.txt",
      uploadedByName: "Autora",
    });

    const download = await request(app)
      .get(`/api/ideas/${ideaId}/attachments/${attachmentId}/download`)
      .set("Authorization", authorization)
      .expect(200);
    expect(download.text).toBe("conteudo do anexo");
  });

  it("rejects unauthenticated access to idea routes", async () => {
    await request(app).get("/api/ideas").expect(401);
  });

  it("allows managers to advance one stage with an auditable reason and refreshes the funnel", async () => {
    ideaRows.set(ideaId, ideaRow());

    await request(app)
      .patch(`/api/ideas/${ideaId}/stage`)
      .set("Authorization", `Bearer ${token("manager-1")}`)
      .send({ reason: "Aprovado para prosseguir após análise do gestor" })
      .expect(200)
      .expect(({ body }) => {
        expect(body.idea.currentStage).toBe("ESCOPO");
        expect(body.idea.status).toBe("EM_ANDAMENTO");
        expect(body.transition).toMatchObject({
          fromStage: "IDEACAO",
          toStage: "ESCOPO",
          changedById: "manager-1",
        });
      });

    expect(ideaRows.get(ideaId)?.current_stage).toBe("ESCOPO");
    const transitions = await request(app)
      .get(`/api/ideas/${ideaId}/stage-transitions`)
      .set("Authorization", `Bearer ${token("manager-1")}`)
      .expect(200);
    expect(transitions.body).toHaveLength(1);
    expect(transitions.body[0]).toMatchObject({
      fromStage: "IDEACAO",
      toStage: "ESCOPO",
      reason: "Aprovado para prosseguir após análise do gestor",
      changedByName: "Gestor",
    });

    const funnel = await request(app)
      .get("/api/ideas/funnel")
      .set("Authorization", `Bearer ${token("manager-1")}`)
      .expect(200);
    expect(funnel.body.ideas[0].currentStage).toBe("ESCOPO");
    expect(new Date(funnel.body.ideas[0].lastMovementAt).getTime()).toBeGreaterThan(
      new Date(ideaRows.get(ideaId)!.created_at).getTime(),
    );
  });

  it("allows administrators to use the funnel and the audited manual transition", async () => {
    ideaRows.set(ideaId, ideaRow());

    await request(app)
      .get("/api/ideas/funnel")
      .set("Authorization", `Bearer ${token("admin-1")}`)
      .expect(200);
    await request(app)
      .patch(`/api/ideas/${ideaId}/stage`)
      .set("Authorization", `Bearer ${token("admin-1")}`)
      .send({ reason: "Encaminhamento administrativo" })
      .expect(200)
      .expect(({ body }) => {
        expect(body.idea.currentStage).toBe("ESCOPO");
        expect(body.transition.changedById).toBe("admin-1");
      });
  });

  it("denies manual stage changes to collaborators and requires a reason", async () => {
    ideaRows.set(ideaId, ideaRow());

    await request(app)
      .patch(`/api/ideas/${ideaId}/stage`)
      .set("Authorization", `Bearer ${token()}`)
      .send({ reason: "Tentativa sem permissão" })
      .expect(403);

    await request(app)
      .patch(`/api/ideas/${ideaId}/stage`)
      .set("Authorization", `Bearer ${token("manager-1")}`)
      .send({ reason: " " })
      .expect(400);

    expect(stageTransitionRows.size).toBe(0);
    expect(ideaRows.get(ideaId)?.current_stage).toBe("IDEACAO");
  });
});
