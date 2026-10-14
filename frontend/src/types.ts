export type Role = "colaborador" | "avaliador" | "administrador";

export type Stage =
  | "Ideação"
  | "Escopo"
  | "Plano de Negócios"
  | "Desenvolvimento"
  | "Teste e Validação"
  | "Lançamento";

export type IdeaStatus = "Em andamento" | "Aprovada" | "Rejeitada" | "Em revisão";

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
  stage: Stage;
  decision: GateDecisionType | "submetida";
  responsible: string;
  feedback: string;
  reviewPoints?: string[];
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  problem: string;
  solution: string;
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
  | "funnel"
  | "idea-detail"
  | "evaluate"
  | "gate-decision"
  | "dashboard"
  | "approved";
