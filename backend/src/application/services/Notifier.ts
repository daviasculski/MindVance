import { Gate } from "../../domain/entities/Gate";
import { GateDecisionType } from "../../domain/entities/GateDecision";
import { Idea } from "../../domain/entities/Idea";
import { IdeaStage } from "../../domain/entities/IdeaStage";
import { NewNotification } from "../../domain/entities/Notification";
import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

const stageLabel: Record<IdeaStage, string> = {
  IDEACAO: "Ideação",
  ESCOPO: "Escopo",
  PLANO_DE_NEGOCIOS: "Plano de Negócios",
  DESENVOLVIMENTO: "Desenvolvimento",
  TESTE_E_VALIDACAO: "Teste e Validação",
  LANCAMENTO: "Lançamento",
};

const recommendationLabel: Record<GateDecisionType, string> = {
  APROVADA: "aprovar",
  REVISAO: "revisar",
  REJEITADA: "rejeitar",
};

const ideaLink = (idea: Idea) => `idea:${idea.id}`;

/**
 * Gatilhos de notificação do BPMN (NOT-02 a NOT-04). Cada método sabe quem
 * recebe e o que dizer. Uma falha ao notificar é registrada no log e nunca
 * desfaz a ação que a originou.
 */
export class Notifier {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  /** Ideia nova → Gestores (triagem) */
  ideaSubmitted(idea: Idea) {
    return this.toGatekeepers({
      type: "IDEA_SUBMITTED",
      title: "Nova ideia para triagem",
      message: `“${idea.title}” foi submetida e aguarda a triagem e a abertura do Gate 1.`,
      ideaId: idea.id,
      link: "triage",
    });
  }

  /** Triagem concluída (G1 aberto) → autor */
  gateOpened(idea: Idea, gate: Gate) {
    return this.toUsers([idea.authorId], {
      type: "GATE_OPENED",
      title: `${gate.name} aberto`,
      message: `“${idea.title}” passou pela triagem. O Gestor de Inovação vai designar os avaliadores.`,
      ideaId: idea.id,
      link: ideaLink(idea),
    });
  }

  /** Autor solicitou revisão (G2–G5 ou nova rodada após Revisar) → Gestores */
  reviewRequested(idea: Idea, gate: Gate, round: number) {
    return this.toGatekeepers({
      type: "GATE_REVIEW_REQUESTED",
      title: round > 1 ? `Reenvio para o ${gate.name} (rodada ${round})` : `Solicitação de revisão do ${gate.name}`,
      message:
        round > 1
          ? `O autor ajustou “${idea.title}” após a revisão. Designe os avaliadores da nova rodada.`
          : `“${idea.title}” está pronta para o ${gate.name}. Designe os avaliadores.`,
      ideaId: idea.id,
      link: "triage",
    });
  }

  /** Designação → avaliadores designados e autor */
  async evaluatorsAssigned(idea: Idea, gate: Gate, round: number, evaluatorIds: string[], deadlineAt: Date) {
    const deadline = deadlineAt.toLocaleDateString("pt-BR");
    await this.toUsers(evaluatorIds, {
      type: "EVALUATOR_ASSIGNED",
      title: `Nova avaliação: ${gate.name}`,
      message: `Você foi designado para avaliar “${idea.title}”${round > 1 ? ` (rodada ${round})` : ""}. Prazo: ${deadline}.`,
      ideaId: idea.id,
      link: "evaluate",
    });
    await this.toUsers([idea.authorId], {
      type: "EVALUATION_STARTED",
      title: "Avaliação iniciada",
      message: `${evaluatorIds.length} avaliador${evaluatorIds.length > 1 ? "es foram designados" : " foi designado"} para o ${gate.name} de “${idea.title}”. A edição fica bloqueada até a decisão.`,
      ideaId: idea.id,
      link: ideaLink(idea),
    });
  }

  /** Todos os pareceres enviados → Gestores e autor */
  async readyForDecision(idea: Idea, gate: Gate, score: number, recommendation: GateDecisionType) {
    const formatted = score.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    await this.toGatekeepers({
      type: "GATE_READY_FOR_DECISION",
      title: `${gate.name} pronto para decisão`,
      message: `Todos os pareceres de “${idea.title}” chegaram. Score ${formatted}; o sistema recomenda ${recommendationLabel[recommendation]}.`,
      ideaId: idea.id,
      link: "decision",
    });
    await this.toUsers([idea.authorId], {
      type: "EVALUATIONS_COMPLETED",
      title: "Pareceres concluídos",
      message: `Os avaliadores concluíram o ${gate.name} de “${idea.title}”. Agora o Gestor de Inovação toma a decisão.`,
      ideaId: idea.id,
      link: ideaLink(idea),
    });
  }

  /** Decisão do gate → autor, com o feedback (NOT-02) */
  gateDecided(idea: Idea, gate: Gate, decision: GateDecisionType, feedback: string, finalStage: boolean) {
    const titles: Record<GateDecisionType, string> = {
      APROVADA: finalStage ? "Ideia aprovada para lançamento" : `Aprovada no ${gate.name}`,
      REVISAO: `Revisão solicitada no ${gate.name}`,
      REJEITADA: `Ideia encerrada no ${gate.name}`,
    };
    const next: Record<GateDecisionType, string> = {
      APROVADA: finalStage
        ? "O ciclo de gates terminou."
        : `A ideia avançou para ${stageLabel[gate.toStage]}. Produza as entregas e solicite o próximo gate.`,
      REVISAO: "Ajuste a ideia e solicite uma nova revisão do gate.",
      REJEITADA: "O histórico e a justificativa ficam preservados.",
    };
    return this.toUsers([idea.authorId], {
      type: "GATE_DECIDED",
      title: titles[decision],
      message: `“${idea.title}”: ${feedback} — ${next[decision]}`,
      ideaId: idea.id,
      link: ideaLink(idea),
    });
  }

  /** Prazo vencido com pareceres faltando → avaliadores atrasados e Gestores (UC02 FA02) */
  async evaluationOverdue(idea: Idea, gate: Gate, round: number, pendingEvaluatorIds: string[]) {
    await this.toUsers(pendingEvaluatorIds, {
      type: "EVALUATION_OVERDUE",
      title: "Prazo de avaliação vencido",
      message: `O prazo do ${gate.name} de “${idea.title}” venceu. A avaliação continua aberta; envie seu parecer assim que possível.`,
      ideaId: idea.id,
      link: "evaluate",
    });
    await this.toGatekeepers({
      type: "EVALUATION_OVERDUE",
      title: `Avaliação atrasada: ${gate.name}`,
      message:
        pendingEvaluatorIds.length > 1
          ? `${pendingEvaluatorIds.length} pareceres de “${idea.title}”${round > 1 ? ` (rodada ${round})` : ""} não chegaram no prazo.`
          : `1 parecer de “${idea.title}”${round > 1 ? ` (rodada ${round})` : ""} não chegou no prazo.`,
      ideaId: idea.id,
      link: "triage",
    });
  }

  private async toGatekeepers(notification: NewNotification) {
    try {
      const users = await this.userRepository.findAll();
      const ids = users.filter((u) => u.effectiveRole === "GATEKEEPER").map((u) => u.id);
      await this.notificationRepository.createForUsers(ids, notification);
    } catch (error) {
      console.error("Notification to gatekeepers failed:", error);
    }
  }

  private async toUsers(userIds: string[], notification: NewNotification) {
    try {
      await this.notificationRepository.createForUsers(userIds, notification);
    } catch (error) {
      console.error("Notification failed:", error);
    }
  }
}
