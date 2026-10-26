import { Prisma } from "@prisma/client";
import { Gate } from "../../domain/entities/Gate";
import { IdeaStage } from "../../domain/entities/IdeaStage";
import { IGateRepository } from "../../domain/repositories/IGateRepository";
import prisma from "../database/prisma/client";

const withCriteria = {
  criteria: { orderBy: { orderIndex: "asc" } },
} satisfies Prisma.GateInclude;

type RawGate = Prisma.GateGetPayload<{ include: typeof withCriteria }>;

function toGate(raw: RawGate): Gate {
  return {
    id: raw.id,
    orderIndex: raw.orderIndex,
    name: raw.name,
    fromStage: raw.fromStage,
    toStage: raw.toStage,
    deliverable: raw.deliverable,
    deadlineDays: raw.deadlineDays,
    approveThreshold: raw.approveThreshold,
    reviseThreshold: raw.reviseThreshold,
    criteria: raw.criteria.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      weight: c.weight,
      orderIndex: c.orderIndex,
    })),
  };
}

export class PrismaGateRepository implements IGateRepository {
  async findAll(): Promise<Gate[]> {
    const list = await prisma.gate.findMany({
      include: withCriteria,
      orderBy: { orderIndex: "asc" },
    });
    return list.map(toGate);
  }

  async findById(id: string): Promise<Gate | null> {
    const raw = await prisma.gate.findUnique({ where: { id }, include: withCriteria });
    return raw ? toGate(raw) : null;
  }

  async findByFromStage(stage: IdeaStage): Promise<Gate | null> {
    const raw = await prisma.gate.findUnique({
      where: { fromStage: stage },
      include: withCriteria,
    });
    return raw ? toGate(raw) : null;
  }
}
