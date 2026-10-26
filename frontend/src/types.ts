export type Role =
  | "colaborador"
  | "avaliador"
  | "gatekeeper"
  | "administrador";

/** Papéis como o backend os representa (enum UserRole do Prisma). */
export type ApiRole =
  | "COLLABORATOR"
  | "EVALUATOR"
  | "GATEKEEPER"
  | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** Papel com que o usuário opera (Colaborador enquanto um pedido não é aprovado) */
  role: Role;
  /** Papel pedido no cadastro; difere de `role` enquanto o pedido está pendente ou recusado */
  requestedRole?: Role;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export type Stage =
  | "Ideação"
  | "Escopo"
  | "Plano de Negócios"
  | "Desenvolvimento"
  | "Teste e Validação"
  | "Lançamento";

export type IdeaStatus =
  | "Aguardando triagem"
  | "Aguardando designação"
  | "Em avaliação"
  | "Aguardando decisão"
  | "Em andamento"
  | "Aprovada"
  | "Rejeitada"
  | "Em revisão";

export type GateDecisionType = "aprovada" | "rejeitada" | "revisão";

export interface Department {
  id: string;
  name: string;
  color: string;
  textColor?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: "image" | "document" | "prototype";
  size: string;
}

export interface TimelineEntry {
  id: string;
  date: string;
  stage?: Stage;
  decision: GateDecisionType | "submetida" | "avaliada";
  responsible: string;
  feedback: string;
  reviewPoints?: string[];
  /** Nota de 0 a 10: do parecer ("avaliada") ou consolidada da rodada (decisões). */
  score?: number;
  /** Gate e rodada da entrada (ausentes em registros anteriores ao modelo de rodadas). */
  gateOrder?: number;
  round?: number;
  /** Recomendação do sistema na decisão do Gestor (D7). */
  recommendation?: GateDecisionType;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  problem: string;
  solution: string;
  /** Presente nas ideias vindas do backend */
  authorId?: string;
  author: string;
  department: string;
  stage: Stage;
  status: IdeaStatus;
  impact: string;
  resources: string;
  submittedAt: string;
  attachments: Attachment[];
  timeline: TimelineEntry[];
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  weight: number;
  score: number;
  comment: string;
}

export interface Evaluation {
  id: string;
  evaluatorName: string;
  ideaId: string;
  ideaTitle: string;
  gate: string;
  deadline: string;
  criteria: EvaluationCriteria[];
  justification: string;
  completed: boolean;
  totalScore: number;
}

export type Screen =
  | "login"
  | "new-idea"
  | "my-ideas"
  | "funnel"
  | "idea-detail"
  | "evaluate"
  | "gate-decision"
  | "triage"
  | "dashboard"
  | "approvals"
  | "users"
  | "approved";
