import nodemailer, { Transporter } from "nodemailer";
import { IEmailService } from "../../application/services/IEmailService";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function layout(content: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:#F5F5F7;font-family:Arial,Helvetica,sans-serif;color:#1D1D1F">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden">
    <tr><td style="padding:24px 32px;background:#1D1D1F;color:#FFFFFF;font-size:20px;font-weight:700">MindVance</td></tr>
    <tr><td style="padding:32px;font-size:15px;line-height:1.6">${content}</td></tr>
    <tr><td style="padding:18px 32px;border-top:1px solid #E5E5EA;color:#8E8E93;font-size:12px">Mensagem automática do MindVance. Não responda a este e-mail.</td></tr>
  </table>
</body>
</html>`;
}

export class EmailService implements IEmailService {
  private transporter?: Transporter;

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "");
    if (!frontendUrl) throw new Error("FRONTEND_URL is not configured");
    const link = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    await this.send(
      to,
      "Redefinição de senha | MindVance",
      `<h1 style="font-size:22px">Redefina sua senha</h1>
       <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
       <p style="margin:28px 0"><a href="${escapeHtml(link)}" style="display:inline-block;padding:13px 20px;background:#F59E0B;border-radius:10px;color:#FFFFFF;text-decoration:none;font-weight:700">Criar nova senha</a></p>
       <p>O link expira em 30 minutos. Se você não solicitou a redefinição, ignore esta mensagem.</p>`,
    );
  }

  async sendIdeaSubmittedEmail(to: string, ideaTitle: string): Promise<void> {
    await this.sendIdeaStatus(to, "Ideia recebida", ideaTitle, "Sua ideia foi recebida e está aguardando avaliação.");
  }

  async sendIdeaEvaluatedToManagerEmail(to: string, ideaTitle: string): Promise<void> {
    await this.sendIdeaStatus(to, "Avaliação concluída", ideaTitle, "Os avaliadores concluíram seus pareceres. Sua ideia seguiu para a decisão do Gestor de Inovação.");
  }

  async sendIdeaFinalDecisionEmail(to: string, ideaTitle: string, status: string, feedback?: string): Promise<void> {
    const details = feedback?.trim()
      ? `<p><strong>Devolutiva do Gestor:</strong><br>${escapeHtml(feedback.trim())}</p>`
      : "";
    await this.sendIdeaStatus(to, `Devolutiva da ideia: ${status}`, ideaTitle, `A situação da sua ideia foi atualizada para <strong>${escapeHtml(status)}</strong>.${details}`);
  }

  async sendIdeaAssignedToEvaluatorEmail(to: string, ideaTitle: string): Promise<void> {
    await this.sendIdeaStatus(to, "Nova avaliação atribuída", ideaTitle, "Uma nova ideia foi atribuída a você para avaliação. Acesse o MindVance para enviar seu parecer.");
  }

  async sendAllEvaluationsCompletedEmail(to: string, ideaTitle: string): Promise<void> {
    await this.sendIdeaStatus(to, "Pareceres concluídos", ideaTitle, "Todas as avaliações solicitadas foram concluídas e aguardam sua decisão no gate.");
  }

  async sendNewIdeaToManagerEmail(to: string, ideaTitle: string, stage: string): Promise<void> {
    await this.sendIdeaStatus(to, "Ideia aguardando ação do Gestor", ideaTitle, `A ideia chegou à etapa <strong>${escapeHtml(stage)}</strong> e aguarda acompanhamento no MindVance.`);
  }

  async sendAccountApprovalRequestToAdminEmail(to: string, newUserName: string, requestedRole: string): Promise<void> {
    await this.send(
      to,
      "Nova solicitação de acesso | MindVance",
      `<h1 style="font-size:22px">Solicitação de acesso</h1>
       <p><strong>${escapeHtml(newUserName)}</strong> solicitou acesso com o perfil <strong>${escapeHtml(requestedRole)}</strong>.</p>
       <p>Acesse a área de solicitações do MindVance para analisar o pedido.</p>`,
    );
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.send(
      to,
      "Bem-vindo ao MindVance",
      `<h1 style="font-size:22px">Bem-vindo(a), ${escapeHtml(name)}!</h1>
       <p>Sua conta de colaborador foi criada com sucesso. Você já pode entrar no MindVance e compartilhar suas ideias.</p>`,
    );
  }

  async sendAccountPendingApprovalEmail(to: string, name: string, requestedRole: string): Promise<void> {
    if (typeof name !== "string" || name.trim().length === 0) {
      throw new Error("A name is required to send the account approval email");
    }
    if (typeof requestedRole !== "string" || requestedRole.trim().length === 0) {
      throw new Error("A requested role is required to send the account approval email");
    }

    await this.send(
      to,
      "MindVance — Solicitação de cadastro em análise",
      `<h1 style="font-size:22px">Solicitação recebida</h1>
       <p>Olá, ${escapeHtml(name.trim())}. Recebemos sua solicitação para acessar o MindVance como <strong>${escapeHtml(requestedRole.trim())}</strong>.</p>
       <p>Os administradores analisarão seu perfil e você receberá outra mensagem quando houver uma decisão.</p>`,
    );
  }

  async sendAccountDecisionEmail(
    to: string,
    name: string,
    status: "APPROVED" | "REJECTED",
    feedback?: string,
  ): Promise<void> {
    const approved = status === "APPROVED";
    const decision = approved ? "aprovada" : "recusada";
    const feedbackHtml = feedback?.trim()
      ? `<p><strong>Observação:</strong><br>${escapeHtml(feedback.trim())}</p>`
      : "";
    await this.send(
      to,
      `Solicitação de acesso ${decision} | MindVance`,
      `<h1 style="font-size:22px">Solicitação ${decision}</h1>
       <p>Olá, ${escapeHtml(name)}. Sua solicitação de acesso foi ${decision} pelo administrador.</p>
       ${approved ? "<p>Você já pode entrar no MindVance com o perfil aprovado.</p>" : ""}
       ${feedbackHtml}`,
    );
  }

  private async sendIdeaStatus(to: string, subject: string, ideaTitle: string, message: string): Promise<void> {
    await this.send(
      to,
      `${subject} | MindVance`,
      `<h1 style="font-size:22px">${escapeHtml(subject)}</h1>
       <p><strong>Ideia:</strong> ${escapeHtml(ideaTitle)}</p>
       <p>${message}</p>`,
    );
  }

  private async send(to: string, subject: string, content: string): Promise<void> {
    await this.getTransporter().sendMail({
      from: process.env.SMTP_FROM ?? '"MindVance" <no-reply@example.com>',
      to,
      subject,
      html: layout(content),
    });
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    const port = Number(SMTP_PORT);
    if (!SMTP_HOST || !Number.isInteger(port) || port < 1 || port > 65535 || !SMTP_USER || !SMTP_PASS) {
      throw new Error("SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS must be configured");
    }
    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    return this.transporter;
  }
}
