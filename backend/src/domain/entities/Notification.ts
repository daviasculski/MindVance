/**
 * Notificação interna (Módulo 5). O `link` diz para onde a notificação leva:
 * "idea:<id>" (detalhe da ideia), "evaluate" (fila do Avaliador),
 * "triage" (triagem e designação) ou "decision" (decisão de gate).
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  ideaId: string | null;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export type NotificationType =
  | "IDEA_SUBMITTED"
  | "GATE_OPENED"
  | "GATE_REVIEW_REQUESTED"
  | "EVALUATOR_ASSIGNED"
  | "EVALUATION_STARTED"
  | "GATE_READY_FOR_DECISION"
  | "EVALUATIONS_COMPLETED"
  | "GATE_DECIDED"
  | "EVALUATION_OVERDUE";

export type NewNotification = Pick<Notification, "type" | "title" | "message"> & {
  ideaId?: string | null;
  link?: string | null;
};
