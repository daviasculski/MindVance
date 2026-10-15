import { IEvaluationRepository } from "../../domain/repositories/IEvaluationRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import {
  EvaluationQueueInputDTO,
  EvaluationQueueOutputDTO,
} from "../dtos/EvaluationDTO";

export class GetEvaluationQueueUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    input: EvaluationQueueInputDTO,
  ): Promise<EvaluationQueueOutputDTO> {
    if (input.requesterRole !== "EVALUATOR") {
      throw new Error("Only users with the Evaluator role have an evaluation queue");
    }

    const [ideas, myEvaluations] = await Promise.all([
      this.ideaRepository.findAll(),
      this.evaluationRepository.findByEvaluatorId(input.requesterId),
    ]);

    // Pendente: ideia de outra pessoa, ainda não lançada e sem avaliação
    // deste avaliador no estágio em que ela está agora
    const pendingIdeas = ideas
      .filter(
        (idea) =>
          idea.authorId !== input.requesterId &&
          idea.currentStage !== "LANCAMENTO" &&
          !myEvaluations.some(
            (e) => e.ideaId === idea.id && e.stage === idea.currentStage,
          ),
      )
      // Quem espera há mais tempo aparece primeiro
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());

    const authorIds = [...new Set(pendingIdeas.map((idea) => idea.authorId))];
    const authors = await this.userRepository.findByIds(authorIds);
    const authorNameById = new Map(authors.map((u) => [u.id, u.name]));
    const ideaTitleById = new Map(ideas.map((idea) => [idea.id!, idea.title]));

    return {
      pending: pendingIdeas.map((idea) => ({
        ideaId: idea.id!,
        title: idea.title,
        description: idea.description,
        authorName: authorNameById.get(idea.authorId) ?? "Colaborador",
        extraFields: idea.extraFields ?? null,
        currentStage: idea.currentStage,
        createdAt: idea.createdAt!,
      })),
      completed: myEvaluations.map((evaluation) => ({
        id: evaluation.id!,
        ideaId: evaluation.ideaId,
        ideaTitle: ideaTitleById.get(evaluation.ideaId) ?? "Ideia removida",
        stage: evaluation.stage,
        score: evaluation.score,
        createdAt: evaluation.createdAt!,
      })),
    };
  }
}
