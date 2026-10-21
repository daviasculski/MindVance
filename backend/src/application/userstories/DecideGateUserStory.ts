import {
  GateDecision,
  isGateDecisionType,
} from "../../domain/entities/GateDecision";
import { ideaStages } from "../../domain/entities/IdeaStage";
import { IEvaluationRepository } from "../../domain/repositories/IEvaluationRepository";
import { IGateDecisionRepository } from "../../domain/repositories/IGateDecisionRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import {
  DecideGateInputDTO,
  DecideGateOutputDTO,
} from "../dtos/GateDecisionDTO";
import { toIdeaOutputDTO } from "../dtos/IdeaDTO";

export class DecideGateUserStory {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly gateDecisionRepository: IGateDecisionRepository,
  ) {}

  async execute(input: DecideGateInputDTO): Promise<DecideGateOutputDTO> {
    if (input.deciderRole !== "GATEKEEPER") {
      throw new Error("Only gatekeepers can decide gates");
    }

    if (!isGateDecisionType(input.decision)) {
      throw new Error("Decision must be APROVADA, REJEITADA or REVISAO");
    }

    const feedback =
      typeof input.feedback === "string" ? input.feedback.trim() : "";

    if (feedback.length === 0) {
      throw new Error("Feedback is required to decide a gate");
    }

    let reviewPoints: string[] | null = null;
    if (input.decision === "REVISAO" && input.reviewPoints !== undefined) {
      if (
        !Array.isArray(input.reviewPoints) ||
        !input.reviewPoints.every((p) => typeof p === "string")
      ) {
        throw new Error("Review points must be a list of texts");
      }
      const points = input.reviewPoints
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0);
      reviewPoints = points.length > 0 ? points : null;
    }

    const idea = await this.ideaRepository.findById(input.ideaId);

    if (!idea) {
      throw new Error("Idea not found");
    }

    if (idea.status !== "EM_ANDAMENTO") {
      throw new Error("Idea is not awaiting a gate decision");
    }

    const stageIndex = ideaStages.indexOf(idea.currentStage);

    if (input.decision === "APROVADA") {
      const evaluations = await this.evaluationRepository.findByIdeaId(idea.id!);
      if (!evaluations.some((e) => e.stage === idea.currentStage)) {
        throw new Error(
          "Cannot approve an idea without evaluations in the current stage",
        );
      }
    }

    const decision = await this.gateDecisionRepository.create(
      new GateDecision({
        ideaId: idea.id!,
        stage: idea.currentStage,
        decision: input.decision,
        feedback,
        reviewPoints,
        deciderId: input.deciderId,
      }),
    );

    const isLastStage = stageIndex === ideaStages.length - 1;
    const updatedIdea = await this.ideaRepository.updateProgress(
      idea.id!,
      input.decision === "APROVADA"
        ? isLastStage
          ? { status: "APROVADA" }
          : { currentStage: ideaStages[stageIndex + 1], status: "EM_ANDAMENTO" }
        : { status: input.decision === "REJEITADA" ? "REJEITADA" : "EM_REVISAO" },
    );

    return {
      decision: {
        id: decision.id!,
        ideaId: decision.ideaId,
        stage: decision.stage,
        decision: decision.decision,
        feedback: decision.feedback,
        reviewPoints: decision.reviewPoints,
        deciderId: decision.deciderId,
        createdAt: decision.createdAt!,
      },
      idea: toIdeaOutputDTO(updatedIdea),
    };
  }
}
