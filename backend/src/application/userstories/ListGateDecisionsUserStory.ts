import { IGateDecisionRepository } from "../../domain/repositories/IGateDecisionRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import {
  GateDecisionOutputDTO,
  ListGateDecisionsInputDTO,
} from "../dtos/GateDecisionDTO";

export class ListGateDecisionsUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly gateDecisionRepository: IGateDecisionRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    input: ListGateDecisionsInputDTO,
  ): Promise<GateDecisionOutputDTO[]> {
    const idea = await this.ideaRepository.findById(input.ideaId);

    if (!idea) {
      throw new Error("Idea not found");
    }

    // Mesma regra das avaliações: autor, avaliadores e administradores
    const isManagement =
      input.requesterRole === "EVALUATOR" ||
      input.requesterRole === "GATEKEEPER" ||
      input.requesterRole === "ADMIN";

    if (!isManagement && idea.authorId !== input.requesterId) {
      throw new Error("Only the idea author can view its gate decisions");
    }

    const decisions = await this.gateDecisionRepository.findByIdeaId(
      input.ideaId,
    );

    const deciderIds = [...new Set(decisions.map((d) => d.deciderId))];
    const deciders = await this.userRepository.findByIds(deciderIds);
    const nameById = new Map(deciders.map((u) => [u.id, u.name]));

    return decisions.map((d) => ({
      id: d.id!,
      ideaId: d.ideaId,
      stage: d.stage,
      decision: d.decision,
      feedback: d.feedback,
      reviewPoints: d.reviewPoints,
      deciderId: d.deciderId,
      deciderName: nameById.get(d.deciderId) ?? "Gestor de Inovação",
      createdAt: d.createdAt!,
    }));
  }
}
