import { IEvaluationRepository } from "../../domain/repositories/IEvaluationRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import {
  IdeaEvaluationOutputDTO,
  ListIdeaEvaluationsInputDTO,
} from "../dtos/EvaluationDTO";

export class ListIdeaEvaluationsUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    input: ListIdeaEvaluationsInputDTO,
  ): Promise<IdeaEvaluationOutputDTO[]> {
    const idea = await this.ideaRepository.findById(input.ideaId);

    if (!idea) {
      throw new Error("Idea not found");
    }

    // Evaluators, managers, and admins see all; collaborators only see their own.
    const isManagement =
      input.requesterRole === "EVALUATOR" ||
      input.requesterRole === "GESTOR_INOVACAO" ||
      input.requesterRole === "ADMIN";

    if (!isManagement && idea.authorId !== input.requesterId) {
      throw new Error("Only the idea author can view its evaluations");
    }

    const evaluations = await this.evaluationRepository.findByIdeaId(
      input.ideaId,
    );

    const evaluatorIds = [...new Set(evaluations.map((e) => e.evaluatorId))];
    const evaluators = await this.userRepository.findByIds(evaluatorIds);
    const nameById = new Map(evaluators.map((u) => [u.id, u.name]));

    // Ordem cronológica, da avaliação mais antiga para a mais recente
    return evaluations
      .map((evaluation) => ({
        id: evaluation.id!,
        evaluatorId: evaluation.evaluatorId,
        evaluatorName: nameById.get(evaluation.evaluatorId) ?? "Avaliador",
        score: evaluation.score,
        justification: evaluation.justification,
        stage: evaluation.stage,
        criteria: evaluation.criteria,
        createdAt: evaluation.createdAt!,
      }))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
