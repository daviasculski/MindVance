export interface IEmailService {
  sendPasswordResetEmail(to: string, resetToken: string): Promise<void>;
  sendIdeaSubmittedEmail(to: string, ideaTitle: string): Promise<void>;
  sendIdeaEvaluatedToManagerEmail(to: string, ideaTitle: string): Promise<void>;
  sendIdeaFinalDecisionEmail(to: string, ideaTitle: string, status: string, feedback?: string): Promise<void>;
  sendIdeaAssignedToEvaluatorEmail(to: string, ideaTitle: string): Promise<void>;
  sendAllEvaluationsCompletedEmail(to: string, ideaTitle: string): Promise<void>;
  sendNewIdeaToManagerEmail(to: string, ideaTitle: string, stage: string): Promise<void>;
  sendAccountApprovalRequestToAdminEmail(to: string, newUserName: string, requestedRole: string): Promise<void>;
  sendWelcomeEmail(to: string, name: string): Promise<void>;
  sendAccountPendingApprovalEmail(to: string, name: string, requestedRole: string): Promise<void>;
  sendAccountDecisionEmail(to: string, name: string, status: "APPROVED" | "REJECTED", feedback?: string): Promise<void>;
}
