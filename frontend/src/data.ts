import type { Idea, Evaluation, Department } from "./types";

export const departments: Department[] = [
  { id: "ti", name: "Tecnologia", color: "#3b82f6", textColor: "#2563EB" },
  { id: "mkt", name: "Marketing", color: "#8b7cf6", textColor: "#6D5CD6" },
  { id: "ops", name: "Operações", color: "#2dd4bf", textColor: "#0D9488" },
  { id: "fin", name: "Financeiro", color: "#d4a72c", textColor: "#A8791F" },
  { id: "rh", name: "Pessoas & Cultura", color: "#f472b6", textColor: "#C2418F" },
  { id: "prod", name: "Produto", color: "#fb7c47", textColor: "#C2540E" },
];

export const ideas: Idea[] = [
  {
    id: "i1",
    title: "Plataforma de Onboarding Automatizado",
    description:
      "Sistema inteligente que personaliza o processo de integração de novos colaboradores com base no cargo, área e perfil comportamental.",
    problem:
      "O onboarding atual é manual, inconsistente entre áreas e gera baixo engajamento nos primeiros 90 dias — taxa de turnover de novos colaboradores é 28% no primeiro semestre.",
    solution:
      "Desenvolver uma plataforma que automatiza trilhas de aprendizado, agenda reuniões de 1:1 automaticamente e acompanha o progresso com checkpoints semanais.",
    author: "Carla Mendes",
    department: "Pessoas & Cultura",
    stage: "Desenvolvimento",
    status: "Em andamento",
    impact: "Redução de 40% no tempo de rampagem e aumento de engajamento medido via NPS interno",
    resources: "1 engenheiro sênior, 1 designer, orçamento de R$ 120.000",
    submittedAt: "2026-01-15",
    attachments: [
      { id: "a1", name: "Pesquisa de NPS Atual.pdf", type: "document", size: "2.4 MB" },
      { id: "a2", name: "Fluxo de Onboarding v2.fig", type: "prototype", size: "8.1 MB" },
    ],
    timeline: [
      {
        id: "t1",
        date: "2026-01-15",
        stage: "Ideação",
        decision: "submetida",
        responsible: "Carla Mendes",
        feedback: "Ideia submetida ao funil de inovação.",
      },
      {
        id: "t2",
        date: "2026-01-28",
        stage: "Ideação",
        decision: "aprovada",
        responsible: "Rafael Torres",
        feedback:
          "Problema bem documentado e alinhado com a prioridade de retenção de talentos. Avança para Escopo.",
      },
      {
        id: "t3",
        date: "2026-02-18",
        stage: "Escopo",
        decision: "revisão",
        responsible: "Marina Costa",
        feedback:
          "Escopo técnico incompleto. Necessário detalhar integrações com HRIS existente.",
        reviewPoints: [
          "Mapear integrações com sistema de RH atual (SAP SuccessFactors)",
          "Definir critérios de sucesso mensuráveis para cada checkpoint",
          "Incluir plano de rollout por porte de área",
        ],
      },
      {
        id: "t4",
        date: "2026-03-05",
        stage: "Escopo",
        decision: "aprovada",
        responsible: "Marina Costa",
        feedback: "Ajustes implementados. Escopo aprovado. Avança para Construção do Plano de Negócios.",
      },
      {
        id: "t5",
        date: "2026-04-02",
        stage: "Plano de Negócios",
        decision: "aprovada",
        responsible: "Rafael Torres",
        feedback: "ROI projetado de 3.2x em 18 meses. Aprovado para desenvolvimento.",
      },
    ],
  },
  {
    id: "i2",
    title: "Motor de Recomendação de Conteúdo por IA",
    description:
      "Algoritmo de recomendação que personaliza o feed de conteúdo da intranet corporativa para cada colaborador.",
    problem:
      "A intranet atual tem taxa de engajamento de apenas 12%. Colaboradores não encontram conteúdo relevante e deixam de usar a plataforma.",
    solution:
      "Implementar modelo de ML colaborativo que aprende preferências e padrões de consumo para recomendar conteúdo de interesse.",
    author: "Lucas Drummond",
    department: "Tecnologia",
    stage: "Teste e Validação",
    status: "Em andamento",
    impact: "Aumentar engajamento na intranet de 12% para 40% em 6 meses",
    resources: "2 engenheiros de ML, infraestrutura cloud, orçamento de R$ 85.000",
    submittedAt: "2025-11-20",
    attachments: [
      { id: "a3", name: "Benchmark de Algoritmos.pdf", type: "document", size: "5.7 MB" },
    ],
    timeline: [
      {
        id: "t6",
        date: "2025-11-20",
        stage: "Ideação",
        decision: "submetida",
        responsible: "Lucas Drummond",
        feedback: "Ideia submetida.",
      },
      {
        id: "t7",
        date: "2025-12-03",
        stage: "Ideação",
        decision: "aprovada",
        responsible: "Ana Lira",
        feedback: "Alta prioridade estratégica. Aprovada.",
      },
      {
        id: "t8",
        date: "2025-12-20",
        stage: "Escopo",
        decision: "aprovada",
        responsible: "Ana Lira",
        feedback: "Escopo técnico sólido. Avança.",
      },
      {
        id: "t9",
        date: "2026-01-15",
        stage: "Plano de Negócios",
        decision: "aprovada",
        responsible: "Rafael Torres",
        feedback: "Plano aprovado.",
      },
      {
        id: "t10",
        date: "2026-02-28",
        stage: "Desenvolvimento",
        decision: "aprovada",
        responsible: "Rafael Torres",
        feedback: "MVP entregue dentro do prazo e orçamento.",
      },
    ],
  },
  {
    id: "i3",
    title: "Dashboard de Sustentabilidade e ESG",
    description:
      "Painel executivo consolidando todos os indicadores ESG da empresa em tempo real.",
    problem:
      "Relatórios ESG são produzidos manualmente, levam 3 semanas por trimestre e apresentam inconsistências entre áreas.",
    solution:
      "Integrar fontes de dados de energia, resíduos, diversidade e cadeia de fornecedores num único dashboard com atualização automática.",
    author: "Beatriz Alves",
    department: "Operações",
    stage: "Ideação",
    status: "Em andamento",
    impact: "Redução de 90% no tempo de consolidação de relatórios ESG",
    resources: "1 analista de dados, integrações com APIs internas, orçamento de R$ 45.000",
    submittedAt: "2026-07-10",
    attachments: [],
    timeline: [
      {
        id: "t11",
        date: "2026-07-10",
        stage: "Ideação",
        decision: "submetida",
        responsible: "Beatriz Alves",
        feedback: "Ideia submetida.",
      },
    ],
  },
  {
    id: "i4",
    title: "Marketplace Interno de Competências",
    description:
      "Plataforma que conecta projetos internos a colaboradores com habilidades específicas disponíveis.",
    problem:
      "Projetos estratégicos ficam parados por falta de pessoas com habilidades específicas, enquanto talentos qualificados estão subutilizados em outras áreas.",
    solution:
      "Criar um marketplace interno onde líderes publicam necessidades de projeto e colaboradores candidatam suas competências.",
    author: "Felipe Santos",
    department: "Produto",
    stage: "Escopo",
    status: "Em andamento",
    impact: "Aumento de 25% na velocidade de alocação de recursos em projetos estratégicos",
    resources: "1 PM, 1 engenheiro, design sprint de 2 semanas",
    submittedAt: "2026-04-22",
    attachments: [
      { id: "a4", name: "Pesquisa com 45 Líderes.pdf", type: "document", size: "3.2 MB" },
      { id: "a5", name: "Wireframes Marketplace.fig", type: "prototype", size: "12.4 MB" },
    ],
    timeline: [
      {
        id: "t12",
        date: "2026-04-22",
        stage: "Ideação",
        decision: "submetida",
        responsible: "Felipe Santos",
        feedback: "Ideia submetida.",
      },
      {
        id: "t13",
        date: "2026-05-08",
        stage: "Ideação",
        decision: "aprovada",
        responsible: "Marina Costa",
        feedback: "Problema validado com pesquisa quantitativa. Aprovado para Escopo.",
      },
    ],
  },
  {
    id: "i5",
    title: "Sistema de Precificação Dinâmica",
    description:
      "Algoritmo que ajusta preços em tempo real com base em demanda, concorrência e estoque.",
    problem:
      "Precificação manual resulta em margens inconsistentes e perda de receita estimada em R$ 2M/ano.",
    solution:
      "Modelo preditivo que processa sinais de mercado e sugere preços ótimos com aprovação humana no loop.",
    author: "Ricardo Fonseca",
    department: "Financeiro",
    stage: "Lançamento",
    status: "Aprovada",
    impact: "Aumento de 12-18% na margem bruta; R$ 3.6M de receita adicional projetada",
    resources: "Time de data science existente, orçamento de R$ 200.000",
    submittedAt: "2025-03-01",
    attachments: [],
    timeline: [],
  },
  {
    id: "i6",
    title: "Chatbot de Atendimento ao Colaborador (HR Bot)",
    description:
      "Assistente virtual para responder dúvidas frequentes de RH via canal interno.",
    problem:
      "O time de RH responde 400+ perguntas repetitivas por mês, consumindo 30% da capacidade da equipe.",
    solution:
      "Chatbot com LLM fine-tuned nas políticas internas de RH, integrado ao Slack e Teams.",
    author: "Amanda Rocha",
    department: "Pessoas & Cultura",
    stage: "Plano de Negócios",
    status: "Em andamento",
    impact: "Liberar 30% da capacidade do time de RH para atividades de maior valor",
    resources: "1 engenheiro, API de LLM, orçamento de R$ 60.000/ano",
    submittedAt: "2026-02-14",
    attachments: [],
    timeline: [],
  },
  {
    id: "i7",
    title: "Automação de Relatórios Regulatórios",
    description:
      "Sistema que gera automaticamente relatórios para órgãos reguladores com dados do ERP.",
    problem:
      "Processo manual de geração de relatórios consome 80h/mês do time de compliance.",
    solution:
      "Conectores nativos ao ERP que extraem, validam e formatam dados no padrão exigido por reguladores.",
    author: "Gustavo Lima",
    department: "Financeiro",
    stage: "Ideação",
    status: "Rejeitada",
    impact: "Eliminação de 80h/mês de trabalho manual; redução de risco de multas regulatórias",
    resources: "1 engenheiro sênior, integração com ERP SAP, R$ 90.000",
    submittedAt: "2026-06-01",
    attachments: [],
    timeline: [
      {
        id: "t14",
        date: "2026-06-01",
        stage: "Ideação",
        decision: "submetida",
        responsible: "Gustavo Lima",
        feedback: "Ideia submetida.",
      },
      {
        id: "t15",
        date: "2026-06-19",
        stage: "Ideação",
        decision: "rejeitada",
        responsible: "Rafael Torres",
        feedback:
          "Iniciativa sobreposta ao módulo de compliance já contratado junto ao ERP SAP para entrega em Q1. Redirecionar o esforço para configuração do módulo existente em vez de construir uma automação paralela.",
      },
    ],
  },
];

export const evaluations: Evaluation[] = [
  {
    id: "e1",
    evaluatorName: "Ana Lira",
    ideaId: "i3",
    ideaTitle: "Dashboard de Sustentabilidade e ESG",
    gate: "Gate 1 — Ideação → Escopo",
    deadline: "2026-09-10",
    criteria: [
      { id: "c1", name: "Alinhamento Estratégico", weight: 30, score: 0, comment: "" },
      { id: "c2", name: "Viabilidade Técnica", weight: 25, score: 0, comment: "" },
      { id: "c3", name: "Potencial de Mercado", weight: 25, score: 0, comment: "" },
      { id: "c4", name: "Risco de Execução", weight: 20, score: 0, comment: "" },
    ],
    justification: "",
    completed: false,
    totalScore: 0,
  },
  {
    id: "e2",
    evaluatorName: "Ana Lira",
    ideaId: "i6",
    ideaTitle: "Chatbot de Atendimento ao Colaborador (HR Bot)",
    gate: "Gate 3 — Escopo → Plano de Negócios",
    deadline: "2026-09-15",
    criteria: [
      { id: "c5", name: "Alinhamento Estratégico", weight: 30, score: 7, comment: "Alinhado com meta de eficiência operacional." },
      { id: "c6", name: "Viabilidade Técnica", weight: 25, score: 8, comment: "Tecnologia madura e time capacitado." },
      { id: "c7", name: "Potencial de Mercado", weight: 25, score: 6, comment: "Impacto interno relevante mas circunscrito." },
      { id: "c8", name: "Risco de Execução", weight: 20, score: 7, comment: "Risco baixo, escopo controlado." },
    ],
    justification: "Projeto bem estruturado com benefícios claros e mensuráveis.",
    completed: true,
    totalScore: 7.1,
  },
];

export const kpiData = {
  submissionsByMonth: [
    { month: "Mar", count: 4 },
    { month: "Abr", count: 7 },
    { month: "Mai", count: 5 },
    { month: "Jun", count: 9 },
    { month: "Jul", count: 12 },
    { month: "Ago", count: 8 },
    { month: "Set", count: 6 },
  ],
  funnelConversion: [
    { stage: "Ideação", count: 51 },
    { stage: "Escopo", count: 34 },
    { stage: "Plano de Negócios", count: 22 },
    { stage: "Desenvolvimento", count: 14 },
    { stage: "Teste e Validação", count: 8 },
    { stage: "Lançamento", count: 5 },
  ],
  avgTimeByStage: [
    { stage: "Ideação", days: 12 },
    { stage: "Escopo", days: 21 },
    { stage: "Plano de Negócios", days: 35 },
    { stage: "Desenvolvimento", days: 90 },
    { stage: "Teste e Validação", days: 45 },
    { stage: "Lançamento", days: 18 },
  ],
  byDepartment: [
    { dept: "Tecnologia", count: 18 },
    { dept: "Produto", count: 12 },
    { dept: "Operações", count: 9 },
    { dept: "Pessoas & Cultura", count: 7 },
    { dept: "Financeiro", count: 5 },
    { dept: "Marketing", count: 4 },
  ],
};
