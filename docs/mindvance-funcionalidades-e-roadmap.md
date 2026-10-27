# MindVance — Funcionalidades, situação da integração e cronograma

Fontes: TCC (seção 2.8.1, Módulos 1 a 6; User Stories; UC01 e UC02; fluxo "Da Ideia ao Lançamento"), BPMN revisado do MindVance e decisões dos autores.

**Situação em 26/10/2026**, branch `feat-avanco-da-integracao`. O fluxo de gates do BPMN (triagem → designação → avaliação → consolidação → decisão, com Revisar e Rejeitar) está integrado de ponta a ponta e foi validado pela API com 70 cenários. Funil e indicadores usam dados reais; nenhuma tela usa mais dados de exemplo. O que falta está na seção 5.

---

## Como ler este documento

| Status | Significado |
|---|---|
| ✅ **FEITO** | Implementado e funcionando conforme a descrição |
| 🟡 **PARCIAL** | Existe, mas falta parte do que está descrito (a observação diz o quê) |
| ⬜ **PENDENTE** | Não existe |
| 🔴 **DIVERGENTE** | Existe, mas contradiz a descrição |
| ❓ **A DECIDIR** | Depende de decisão dos autores |
| ⏸️ **FORA DO ESCOPO** | Decidido que não entra nesta entrega |

**Resumo dos 105 itens com ID** (sem contar DOC, que é do documento do TCC):

| ✅ Feito | 🟡 Parcial | ⬜ Pendente | 🔴 Divergente | ❓ A decidir | ⏸️ Fora do escopo |
|---|---|---|---|---|---|
| 60 | 17 | 20 | 0 | 7 | 1 |

**Prioridade definida pelos autores:** completar a integração e as funcionalidades. **Seed e testes só se houver tempo** (estão contados como pendentes).

Referências de código são relativas à raiz do repositório. "Mock" = a tela usa `frontend/src/data.ts`, não a API.

---

## 1. Decisões

### 1.1 Decisões de base

- **D1. Quatro perfis**, um papel por usuário:
  - **Colaborador:** cria e submete ideias, produz as entregas de cada estágio e solicita revisão de gate.
  - **Avaliador:** pontua ideias nos gates para os quais foi designado; mantém os acessos do Colaborador.
  - **Gestor de Inovação** (`GATEKEEPER`): faz a triagem em Ideação, designa avaliadores, toma a decisão final dos gates e acompanha o funil e os KPIs.
  - **Administrador:** backoffice — usuários e papéis, e leitura dos KPIs (D12).
- **D2.** O Administrador **não decide gates, não designa avaliadores e não acessa o funil**.
- **D3.** A **designação de avaliadores é do Gestor**.
- **D4.** A **decisão final é do Gestor**, com **justificativa obrigatória** em qualquer decisão.
- **D5.** Três saídas: **Aprovar** (avança), **Revisar** (volta ao autor no mesmo estágio), **Rejeitar** (arquivada).
- **D6.** O **G1** é aberto por **triagem do Gestor**. Nos **G2 a G5**, quem solicita a revisão é o **autor**.
- **D7.** O **sistema recomenda** e o **Gestor decide**, podendo decidir diferente.
- **D8.** Nome **MindVance**; infraestrutura **só local, via Docker Compose**.
- **D9.** Termos voltados ao usuário em **pt-BR do TCC**.

### 1.2 Decisões tomadas em 26/10/2026

| # | Decisão | Como ficou no código |
|---|---|---|
| **D10 · Papel no cadastro** (substitui AUT-01 e ADM-02) | No cadastro o usuário escolhe Colaborador, Avaliador ou Gestor (Administrador não aparece). Avaliador e Gestor ficam pendentes até o Admin aprovar; **enquanto isso o usuário opera como Colaborador**. O Admin aprova, recusa e pode trocar o papel de qualquer usuário depois. | Papel efetivo calculado no backend (`User.effectiveRole`); login, JWT e middleware usam o papel efetivo; telas **Usuários** e **Solicitações** do Admin |
| **D11 · Fim do fluxo** | O G5 é o último gate. **Aprovar no G5 leva ao Lançamento com status "Aprovada para lançamento" e encerra o ciclo.** Sem 6ª decisão; no Lançamento não há solicitar revisão, designação, avaliação nem decisão. O fim é identificado pelo estágio sem gate de saída, não por número fixo. Revisão pós-lançamento fora do escopo. | `DecideGateUserStory` (aprovar → estágio seguinte; se não tem gate de saída, status `APROVADA`); `leadsToFinalStage` informado ao front |
| **D12 · Exclusão e Administrador** | **Ninguém exclui ideias**, avaliações nem transições: o histórico é imutável. O Administrador fica com usuários/papéis e **KPIs só leitura**; sem funil, triagem, designação, avaliação ou decisão. **Parâmetros dos gates (critérios, pesos, faixas, prazos) ficam fora da interface** nesta entrega e vêm do banco. | Rota de exclusão removida; chaves estrangeiras `RESTRICT`; `/ideas/metrics` para Gestor e Admin; gates e critérios inseridos pela migration |
| **D13 · Revisar = Recycle** | A edição **não** reenvia a ideia. O autor edita e anexa entregas livremente em Revisar; o reenvio é só pelo botão **"Solicitar revisão"**, que cria uma **nova rodada no mesmo gate** (rodada + 1), muda o status para "Aguardando designação" e notifica o Gestor. A designação da nova rodada pode vir preenchida com os avaliadores anteriores. **Em avaliação, a edição fica bloqueada.** Rodadas anteriores ficam preservadas no detalhe; consolidação e decisão usam só a rodada atual. | Tabelas `gate_reviews` (rodadas) e `gate_review_evaluators`; edição só em "Aguardando triagem", "Em andamento" e "Em revisão"; designação sugerida pela rodada anterior. Notificação: pendente (fase de notificações) |
| **D14 · Nota e recomendação** | Média de cada critério entre os avaliadores da rodada; **score = Σ(média × peso / 100)**, de 0 a 10. **≥ 7,0 Aprovar; ≥ 4,0 e < 7,0 Revisar; < 4,0 Rejeitar** (limites inclusivos). Valores no banco, iguais para todos os gates. O anel do frontend usa a mesma regra, inclusive no empate. A recomendação é sugestão; a transição registra recomendação e decisão. | `domain/entities/Gate.ts` (`consolidatedScore`, `recommendation`); `frontend/src/lib/gateReviews.ts` (`recommend`) com a mesma regra; testado: 7,0 → Aprovar, 4,0 → Revisar |

### 1.3 Ainda a decidir

| # | Pergunta | Como está hoje |
|---|---|---|
| GAT-12 | Avaliador atrasado: reatribuir, quórum parcial ou aguardar? | Aguarda: a decisão só libera com todos os pareceres. O atraso é sinalizado ao Avaliador e ao Gestor |
| GAT-01 | E se o Gestor não abrir o G1? | A ideia fica em "Aguardando triagem", com o contador de dias parado |
| SUB-07 | Gestor e Admin submetem ideias? | Avaliador sim (D1). Gestor e Admin não têm a tela |
| ACO-06 | "Aprovada" no Mural é passar em qualquer gate ou chegar ao Lançamento? | Chegar ao Lançamento (coerente com D11) |
| ADM-06 | Log das alterações de backoffice? | Não existe |
| ADM-07 | Departamentos pela interface? | Fixos no frontend; o backend não guarda departamento |
| ENG-02 | Pontos por colaboração em ideias alheias? | Não existe nada de colaboração |
| Estágio 3 | Rótulo "Plano de Negócios" ou "Construção do Plano de Negócios"? | "Plano de Negócios" na interface |

### 1.4 Divergências corrigidas

| # | Divergência | Critério de aceite | Situação |
|---|---|---|---|
| DIV-1 | KPIs só com o Administrador | `/ideas/metrics` responde ao Gestor e ao Admin (só leitura) e 403 aos demais; "Indicadores" no menu dos dois | ✅ testado |
| DIV-2 | Admin acessava o funil | Admin sem funil, triagem, designação e decisão (menu e API) | ✅ testado |
| DIV-3 | Avaliador via o funil completo | Funil só no menu do Gestor; o Avaliador vê só as rodadas em que foi designado | ✅ testado |
| DIV-4 | Aprovar no G5 exigia uma 6ª decisão | Aprovar no G5 → `LANCAMENTO` / "Aprovada para lançamento"; no Lançamento, solicitar revisão responde 409 | ✅ testado (G1→G5) |
| DIV-5 | Revisar não permitia nova rodada | Revisar → autor edita (status continua "Em revisão") → "Solicitar revisão" abre rodada 2 → nova designação e avaliação; rodada 1 preservada | ✅ testado |
| DIV-6 | Sem triagem: a ideia ia direto aos avaliadores | Ideia nova fica "Aguardando triagem"; só o Gestor abre o G1 | ✅ testado |
| DIV-7 | Fila do Avaliador mostrava todas as ideias | Fila só com rodadas em que ele foi designado, com prazo | ✅ testado |
| DIV-8 | "Solicitar revisão" aparecia no G1 e não fazia nada | Só para o autor, só G2–G5 ou após Revisar, fora de avaliação; abre a rodada | ✅ testado |
| DIV-9 | Qualquer usuário listava e abria todas as ideias | Só o Gestor lista todas; demais veem as próprias e as do Mural; abrir uma ideia exige ser autor, Gestor ou avaliador designado | ✅ testado |

---

## 2. Fluxo ponta a ponta (BPMN) e situação atual

### 2.1 Pool "Avaliação de Ideias no Gate"

| Passo | Ator | O que o BPMN prevê | Situação | Status da ideia |
|---|---|---|---|---|
| 1 | Colaborador | Cria e submete a ideia (formulário + anexos) | ✅ Formulário com validação no front e na API · ⬜ anexos | — |
| 2 | Sistema | Registra em Ideação e notifica o Gestor | ✅ Registra · ⬜ notificação | Aguardando triagem |
| 3 | Gestor | Triagem e abertura do G1 | ✅ Tela **Triagem e designação** | Aguardando designação |
| 4 | Gestor | Designa avaliadores (autor bloqueado) | ✅ Só avaliadores aprovados; autor recusado no backend; prazo começa a contar | Em avaliação |
| 5 | Sistema | Notifica os designados | ⬜ | — |
| 6 | Avaliadores | Nota 0–10 e comentário por critério + justificativa | ✅ Só designados; critérios do gate; todas as notas obrigatórias; um parecer por rodada | Em avaliação |
| 6a | Sistema | Prazo vencido → alerta e registra atraso | 🟡 Atraso sinalizado na fila do Avaliador e do Gestor · ⬜ notificação e registro no histórico | — |
| 7 | Sistema | Consolida, compara ao threshold, recomenda, notifica o Gestor | ✅ Consolidação e recomendação automáticas ao último parecer · ⬜ notificação | Aguardando decisão |
| 8 | Gestor | Analisa recomendação e pareceres, decide com justificativa | ✅ Tela **Decisão de Gate** | — |
| 9 | Sistema | Registra a transição, atualiza estágio/status, notifica o autor, pontua | ✅ Transição imutável com recomendação e score · ⬜ notificação e pontos | — |
| 10a | — | Rejeitar: arquiva, fim | ✅ | Encerrada |
| 10b | Colaborador | Revisar: ajusta e solicita nova revisão (mesmo gate) | ✅ Edição livre; "Solicitar revisão" abre nova rodada | Em revisão → Aguardando designação |
| 10c | Colaborador | Aprovar antes do G5: produz entregas e solicita o próximo gate | ✅ Avança; autor edita e solicita · ⬜ anexar entregas | Em andamento → Aguardando designação |
| 10d | — | Aprovar no G5: Lançamento, fim | ✅ | Aprovada para lançamento |

### 2.2 Pool "Backoffice"

| Passo | Ator | O que o BPMN prevê | Situação |
|---|---|---|---|
| 11 | Administrador | Gerencia usuários e atribui papéis | ✅ Telas **Usuários** (troca de papel) e **Solicitações** (aprovar/recusar) |
| 11 | Administrador | Mantém critérios, pesos, threshold e prazos | ⏸️ Fora da interface nesta entrega (D12); valores no banco |
| 12 | Sistema | Persiste e registra log | ✅ Persiste · ❓ log (ADM-06) |

### 2.3 Estágios, gates e critérios (no banco)

| Estágio | Gate de saída | Entrega exigida | Prazo | Limites |
|---|---|---|---|---|
| Ideação | Gate 1 | Ideia submetida | 7 dias | aprovar ≥ 7,0 · revisar ≥ 4,0 |
| Escopo | Gate 2 | Esboço de plano de negócios | 7 dias | idem |
| Plano de Negócios | Gate 3 | Especificações técnicas de desenvolvimento | 7 dias | idem |
| Desenvolvimento | Gate 4 | Resultados de testes e validação | 7 dias | idem |
| Teste e Validação | Gate 5 | Plano de lançamento | 7 dias | idem |
| Lançamento | — (estágio final) | — | — | — |

Critérios de todos os gates: Alinhamento Estratégico 30%, Viabilidade Técnica 25%, Potencial de Mercado 25%, Risco de Execução 20%. O Risco é pontuado de forma inversa pelo avaliador ("quanto menor o risco, maior a nota"), sem inversão no cálculo.

### 2.4 Rotas da API do fluxo

| Ação | Rota | Quem |
|---|---|---|
| Abrir G1 (triagem) ou solicitar revisão do gate | `POST /api/ideas/:id/gate-reviews` | Gestor (triagem) · autor (G2–G5 e após Revisar) |
| Filas do Gestor | `GET /api/gate-reviews?status=AGUARDANDO_DESIGNACAO \| EM_AVALIACAO \| AGUARDANDO_DECISAO` | Gestor |
| Detalhe da rodada com pareceres | `GET /api/gate-reviews/:id` | Gestor |
| Designar avaliadores | `POST /api/gate-reviews/:id/evaluators` | Gestor |
| Decidir | `POST /api/gate-reviews/:id/decision` | Gestor |
| Fila do avaliador | `GET /api/evaluations/queue` | Avaliador |
| Enviar parecer | `POST /api/evaluations` | Avaliador designado |
| Gates, critérios e limites | `GET /api/gates` | Qualquer usuário logado |
| Histórico da ideia | `GET /api/ideas/:id/evaluations` · `GET /api/ideas/:id/gate-decisions` | Autor, Gestor, avaliadores designados |
| Usuários e papéis | `GET /api/users` · `PATCH /api/users/:id/role` | Administrador |
| KPIs | `GET /api/ideas/metrics` | Gestor e Administrador |

---

## 3. Funcionalidades e situação

### 3.1 Infraestrutura e base

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| INF-01 | `docker-compose.yml` sobe o PostgreSQL; projeto roda pelo README | ✅ FEITO | `docker-compose.yml`, `README.md` | Banco `mindvance`, porta configurável |
| INF-02 | Nenhuma referência a nuvem | ✅ FEITO | busca no repositório | — |
| INF-03 | Nome MindVance visível | ✅ FEITO | `Login.tsx`, `Sidebar.tsx`, `site.json`, `package.json`, README | Sobra só o prompt histórico em `frontend/src/imports/` |
| INF-04 | `.env.example` com banco, JWT e limite de upload | 🟡 PARCIAL | `backend/.env.example` | Falta o limite de upload (entra com anexos) |
| INF-05 | Erros padronizados, mensagens por campo | 🟡 PARCIAL | `backend/src/presentation/http.ts` (`sendError`) | Formato `{ error }` e status por mensagem nas rotas novas; sem erro por campo; mensagens em inglês |

### 3.2 Modelo de dados

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| DER-01 | Entidades do DER | 🟡 PARCIAL | `backend/prisma/schema.prisma` | Existem `users`, `ideas`, `gates`, `gate_criteria`, `gate_reviews` (rodadas), `gate_review_evaluators` (designação), `evaluations` (≈ `gate_evaluations`) e `gate_decisions` (≈ `stage_transitions`). Faltam `departments`, `stages` (enum), `attachments`, `notifications`, `engagement_points`; notas por critério em JSON, não em tabela |
| DER-02 | Quatro papéis | ✅ FEITO | enum `UserRole` | — |
| DER-03 | `gates` com prazo e threshold | ✅ FEITO | modelo `Gate` | `deadlineDays`, `approveThreshold`, `reviseThreshold` |
| DER-04 | `gate_criteria` por gate, pesos somando 100 | ✅ FEITO | modelo `GateCriterion`, migration `20261026232000` | Sem validação de soma porque não há edição pela interface (D12) |
| DER-05 | `ideas` com os campos e status | 🟡 PARCIAL | modelo `Idea` | 8 status do fluxo. Problema, departamento, impacto e recursos ficam em JSONB, sem coluna própria |
| DER-06 | Registro de designação | ✅ FEITO | `gate_review_evaluators` | — |
| DER-07 | Transição completa e imutável | ✅ FEITO | `gate_decisions` | Responsável, data, rodada (→ gate), estágio de origem e destino, decisão, recomendação, score, justificativa, pontos de revisão. Sem update/delete; FKs `RESTRICT` |
| DER-08 | Nota e comentário por critério; 1 parecer por avaliador e rodada | ✅ FEITO | `evaluations` (`reviewId` + `evaluatorId` únicos, `criteria` JSON) | Nome e peso copiados no envio |
| DER-09 | Nova rodada no mesmo gate após Revisar | ✅ FEITO | `gate_reviews.round` | Testado (DIV-5) |

### 3.3 Seed (só se houver tempo)

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| SEED-01 | Departamentos padrão | ⬜ PENDENTE | `frontend/src/data.ts` | Fixos no frontend |
| SEED-02 | Seis estágios | 🟡 PARCIAL | enum `IdeaStage` | Enum, não tabela; rótulo do 3º estágio a decidir |
| SEED-03 | Cinco gates com prazo e threshold | ✅ FEITO | migration `20261026232000` | Inseridos pela migration (configuração do sistema) |
| SEED-04 | Critérios 30/25/25/20 | ✅ FEITO | migration `20261026232000` | Idem |
| SEED-05 | Usuário de cada perfil | ⬜ PENDENTE | `README.md` (passo 5) | Opcional; o README explica como criar o primeiro Admin |

### 3.4 Autenticação e acesso

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| AUT-01 | Cadastro (substituído por D10) | 🟡 PARCIAL | `CreateUserUserStory.ts`, `User.effectiveRole`, `Login.tsx` | Conforme D10, mas o departamento ainda não é salvo |
| AUT-02 | Login bcrypt + JWT com id e papel | ✅ FEITO | `LoginUserStory.ts` | JWT com o papel efetivo |
| AUT-03 | Middleware JWT | ✅ FEITO | `ensureAuthenticated.ts` | Relê o papel no banco a cada requisição |
| AUT-04 | RBAC com a matriz | ✅ FEITO | `ensureRole.ts`, `policies/ideaHistoryAccess.ts`, UserStories | Matriz da seção 3.12 aplicada e testada; Gestor/Admin submeterem ideias segue a decidir (SUB-07) |
| AUT-05 | Rotas e menus por perfil no front | ✅ FEITO | `frontend/src/lib/navigation.ts` | Fonte única para menu e guarda de tela |
| AUT-06 | Logout e token expirado | ✅ FEITO | `lib/auth.ts` | — |

### 3.5 Submissão de ideias

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| SUB-01 | Formulário completo | ✅ FEITO | `NewIdea.tsx` | — |
| SUB-02 | Anexos em `attachments` | ⬜ PENDENTE | — | — |
| SUB-03 | UC01 FA01: obrigatórios por campo | ✅ FEITO | `NewIdea.tsx`, `CreateIdeaUserStorie.ts` | Front e API validam |
| SUB-04 | UC01 FA02: anexo inválido sem perder campos | ⬜ PENDENTE | — | Depende de SUB-02 |
| SUB-05 | Redireciona para "Minhas ideias" | 🟡 PARCIAL | `NewIdea.tsx` | Tela de sucesso com botão "Ver minhas ideias" |
| SUB-06 | Registra em Ideação e notifica o Gestor | 🟡 PARCIAL | `CreateIdeaUserStorie.ts` | Entra em "Aguardando triagem" e aparece na triagem; falta a notificação |
| SUB-07 | Avaliador submete; Gestor/Admin a decidir | ❓ A DECIDIR | `lib/navigation.ts` | Avaliador sim |

### 3.6 Acompanhamento da ideia

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| ACO-01 | "Minhas ideias" com estágio e status | ✅ FEITO | `MyIdeas.tsx` | — |
| ACO-02 | Detalhe com conteúdo, anexos e timeline | 🟡 PARCIAL | `IdeaDetail.tsx` | Timeline com submissão, pareceres e decisões por gate e rodada, com recomendação; faltam anexos |
| ACO-03 | Pontos a ajustar em destaque em Revisar | ✅ FEITO | `IdeaDetail.tsx` | — |
| ACO-04 | Editar a ideia e anexar entregas | 🟡 PARCIAL | `IdeaDetail.tsx` (`EditIdeaForm`), `UpdateIdeaUserStory.ts` | Edição pronta (D13); falta anexar entregas |
| ACO-05 | "Solicitar revisão do gate" | ✅ FEITO | `IdeaDetail.tsx`, `OpenGateReviewUserStory.ts` | Notificar o Gestor entra com as notificações |
| ACO-06 | Vitrine de aprovadas para todos | ❓ A DECIDIR | `ApprovedBoard.tsx` | Integrado e no menu dos 4 perfis; mostra quem chegou ao Lançamento |
| ACO-07 | Próximo passo esperado | ✅ FEITO | `lib/ideas.ts` (`nextStep`), `IdeaDetail.tsx` | — |

### 3.7 Funil (Gestor)

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| FUN-01 | Kanban 6 colunas com contagem | ✅ FEITO | `KanbanFunnel.tsx`, `GET /ideas/funnel` | Dados reais; colunas que afunilam e contagem de quantas chegaram a cada estágio |
| FUN-02 | Card com título, autor, departamento, status e gate | ✅ FEITO | `KanbanFunnel.tsx` | Também a rodada (quando > 1) e a justificativa das encerradas |
| FUN-03 | Filtros por departamento, período e status | ✅ FEITO | `KanbanFunnel.tsx` | Área, status e período de submissão; encerradas fora do funil ativo, com opção de exibir |
| FUN-04 | Funil só do Gestor; Avaliador só as atribuídas | ✅ FEITO | `lib/navigation.ts`, `GetEvaluationQueueUserStory.ts` | — |
| FUN-05 | Gate Aging no card | ✅ FEITO | `GetFunnelUserStory.ts` (`lastMovementAt`), `GateAgingBadge.tsx` | Conta desde a última submissão, abertura de rodada ou decisão |

### 3.8 Ciclo de gate

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| GAT-01 | Triagem e abertura do G1 | ✅ FEITO | `GateTriage.tsx`, `OpenGateReviewUserStory.ts` | Sem saída se o Gestor não abrir (a decidir) |
| GAT-02 | Fila de solicitações G2–G5 | ✅ FEITO | `GateTriage.tsx` (Aguardando designação) | Mesma fila da designação; reenvios após Revisar sinalizados |
| GAT-03 | Designação pelo Gestor | ✅ FEITO | `GateTriage.tsx`, `AssignEvaluatorsUserStory.ts` | — |
| GAT-04 | Autor não pode ser designado (backend) | ✅ FEITO | `AssignEvaluatorsUserStory.ts` | Testado |
| GAT-05 | Notificar os designados | ⬜ PENDENTE | — | Fase de notificações |
| GAT-06 | Fila só dos designados, com prazo | ✅ FEITO | `GetEvaluationQueueUserStory.ts`, `GateEvaluation.tsx` | — |
| GAT-07 | Tela de avaliação com conteúdo e histórico ao lado | 🟡 PARCIAL | `GateEvaluation.tsx` | Conteúdo, critérios com descrição, peso, comentário e justificativa; falta o histórico ao lado |
| GAT-08 | UC02 FA01: bloquear sem nota ou sem justificativa | ✅ FEITO | `GateEvaluation.tsx`, `SubmitEvaluationUserStory.ts` | Notas começam vazias |
| GAT-09 | Um parecer por rodada; só designados | ✅ FEITO | `SubmitEvaluationUserStory.ts` | Parecer não é editável |
| GAT-10 | Verdict Ring com a regra do backend | ✅ FEITO | `VerdictRing.tsx`, `lib/gateReviews.ts` | Empate correto; mostra até 2 casas |
| GAT-11 | UC02 FA02: prazo vencido | 🟡 PARCIAL | `GetEvaluationQueueUserStory.ts`, `GateReviewQueriesUserStory.ts` | Atraso calculado na consulta e sinalizado ao Avaliador e ao Gestor; faltam notificação e registro no histórico |
| GAT-12 | Avaliador atrasado | ❓ A DECIDIR | — | Hoje aguarda |
| GAT-13 | Consolidação quando todos concluem | ✅ FEITO | `domain/entities/Gate.ts` | Média por critério (D14) |
| GAT-14 | Recomendação | ✅ FEITO | `domain/entities/Gate.ts` | Faixas 7,0 / 4,0 (D14) |
| GAT-15 | Notificar o Gestor | 🟡 PARCIAL | `GateDecision.tsx` | O gate entra na fila de decisão; falta a notificação |
| GAT-16 | Painel de decisão | ✅ FEITO | `GateDecision.tsx` | Score, recomendação, pareceres por critério |
| GAT-17 | Três botões; justificativa obrigatória | ✅ FEITO | `GateDecision.tsx`, `DecideGateUserStory.ts` | — |
| GAT-18 | Decidir contra a recomendação, registrando as duas | ✅ FEITO | `gate_decisions.recommendation` | Tela avisa ao decidir diferente |
| GAT-19 | Só o Gestor decide | ✅ FEITO | `gateReview.routes.ts`, `DecideGateUserStory.ts` | — |
| GAT-20 | Toda decisão grava a transição | ✅ FEITO | `gate_decisions` | — |
| GAT-21 | Aprovar avança; G5 → Lançamento | ✅ FEITO | `DecideGateUserStory.ts` | D11 |
| GAT-22 | Revisar | ✅ FEITO | `DecideGateUserStory.ts` | — |
| GAT-23 | Rejeitar arquiva e preserva histórico | ✅ FEITO | `DecideGateUserStory.ts` | Sem exclusão (D12) |
| GAT-24 | Notificar o autor e lançar pontos | ⬜ PENDENTE | — | Fases de notificações e engajamento |
| GAT-25 | Ciclo nos 5 gates com nova rodada | ✅ FEITO | roteiro de teste pela API | G1→G5 com Revisar e Rejeitar |

### 3.9 Notificações

| ID | Item | Status |
|---|---|---|
| NOT-01 | Notificações persistidas, não lidas, marcar como lida | ⬜ PENDENTE |
| NOT-02 | Autor notificado a cada mudança de status | ⬜ PENDENTE |
| NOT-03 | Gestor: ideia nova, solicitação, gate pronto, atraso | ⬜ PENDENTE |
| NOT-04 | Avaliador: designação, prazo vencido | ⬜ PENDENTE |
| NOT-05 | Link para o item | ⬜ PENDENTE |

### 3.10 Engajamento

| ID | Item | Status | Observação |
|---|---|---|---|
| ENG-01 | Pontos por submissão e aprovação | ⬜ PENDENTE | — |
| ENG-02 | Pontos por colaboração | ❓ A DECIDIR | Nada no código |
| ENG-03 | Ranking interno | ⬜ PENDENTE | — |
| ENG-04 | Total de pontos no perfil | ⬜ PENDENTE | — |

### 3.11 KPIs (Gestor; Admin só leitura — D12)

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| KPI-01 | Ideias por período | ✅ FEITO | `GetInnovationMetricsUserStory.ts`, `KPIDashboard.tsx` | Série mensal contínua |
| KPI-02 | Conversão entre estágios | ✅ FEITO | idem | Aprovação por gate (aprovadas / decisões finais) e quantas ideias chegaram a cada estágio |
| KPI-03 | Tempo médio por estágio | ✅ FEITO | idem, `services/ideaJourney.ts` | Inclui ideias ainda no estágio; gargalo rotulado |
| KPI-04 | Distribuição por departamento | ✅ FEITO | idem | — |
| KPI-05 | Status dos aprovados em desenvolvimento | ✅ FEITO | idem | Ideias em Desenvolvimento ou Teste e Validação, com status |
| KPI-06 | Painel para Gestor (e Admin, leitura), com período | ✅ FEITO | `KPIDashboard.tsx`, `idea.routes.ts` | 30 dias, 90 dias, 12 meses, tudo ou personalizado; Admin vê "somente leitura" |

### 3.12 Backoffice (Administrador)

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| ADM-01 | Lista de usuários | 🟡 PARCIAL | `UsersAdmin.tsx`, `GET /users` | Nome, e-mail, papel e pedido; falta departamento |
| ADM-02 | Atribuição de papel (substituído por D10) | ✅ FEITO | `UsersAdmin.tsx`, `ApprovalRequests.tsx` | Aprovar/recusar pedido e trocar papel de qualquer usuário |
| ADM-03 | Configurar critérios, pesos, threshold e prazo | ⏸️ FORA DO ESCOPO | migration `20261026232000` | D12: valores no banco, sem interface |
| ADM-04 | Mudança de critérios não altera avaliações | ✅ FEITO | `evaluations.criteria` | Nome e peso copiados no envio |
| ADM-05 | Admin sem funil, triagem, designação e decisão | ✅ FEITO | `lib/navigation.ts`, `gateReview.routes.ts` | Testado |
| ADM-06 | Log de backoffice | ❓ A DECIDIR | — | — |
| ADM-07 | Departamentos pela interface | ❓ A DECIDIR | `frontend/src/data.ts` | — |

**Matriz de permissões (aplicada e testada pela API)**

| Ação | Colab. | Aval. | Gestor | Admin |
|---|---|---|---|---|
| Submeter ideia e ver as próprias | ✅ | ✅ | a decidir | a decidir |
| Ver ideias aprovadas (Mural) | ✅ | ✅ | ✅ | ✅ |
| Editar a própria ideia (fora do gate) | ✅ | ✅ | — | — |
| Solicitar revisão de gate (G2–G5 e após Revisar, só as próprias) | ✅ | ✅ | — | — |
| Triagem e abertura do G1 | — | — | ✅ | — |
| Designar avaliadores | — | — | ✅ | — |
| Avaliar (só onde designado e não sendo autor) | — | ✅ | — | — |
| Decidir gate | — | — | ✅ | — |
| Ver todas as ideias e o funil | — | — | ✅ | — |
| Histórico detalhado de uma ideia | autor | designado | ✅ | — |
| KPIs | — | — | ✅ | ✅ (leitura) |
| Usuários e papéis | — | — | — | ✅ |
| Excluir ideias | — | — | — | — (ninguém) |

### 3.13 Frontend

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| FRO-01 | Inventário das telas | ✅ FEITO | seção 3.13.1 | — |
| FRO-02 | Telas por perfil | 🟡 PARCIAL | seção 3.13.1 | Faltam notificações, ranking e anexos |
| FRO-03 | Cliente da API | 🟡 PARCIAL | `lib/api.ts` | URL por env, JWT, 401 → login; sem 403 central nem erros por campo |
| FRO-04 | Mocks substituídos | ✅ FEITO | `frontend/src/data.ts` | Nenhuma tela usa dados de exemplo; `data.ts` ficou só com os departamentos |
| FRO-05 | Assinaturas visuais | 🟡 PARCIAL | `components/` | Real Funnel, Verdict Ring, Weighted Sliders, Stage Weight e Gate Aging com dados reais; faltam os marcadores de gate no Gate Rail |
| FRO-06 | Reprovação com tratamento neutro | ✅ FEITO | `StatusBadge.tsx`, `VerdictRing.tsx` | Cinza, sem vermelho |
| FRO-07 | Carregamento, vazio e erro | ✅ FEITO | todas as telas | Funil e Indicadores incluídos |
| FRO-08 | `Create` como frontend oficial | ❓ A DECIDIR | `frontend/` | Na prática já é: o `frontend/` é o conteúdo da `Create` |

#### 3.13.1 Inventário de telas

| Tela | Arquivo | Perfis | Dados |
|---|---|---|---|
| Login e cadastro | `screens/Login.tsx` | — | ✅ API |
| Nova ideia | `screens/NewIdea.tsx` | Colaborador, Avaliador | ✅ API |
| Minhas ideias | `screens/MyIdeas.tsx` | Colaborador, Avaliador | ✅ API |
| Detalhe da ideia (editar, solicitar revisão, histórico) | `screens/IdeaDetail.tsx` | Todos | ✅ API |
| Mural de aprovadas | `screens/ApprovedBoard.tsx` | Todos | ✅ API |
| Fila de avaliações e avaliação | `screens/GateEvaluation.tsx` | Avaliador | ✅ API |
| Triagem e designação | `screens/GateTriage.tsx` | Gestor | ✅ API |
| Decisão de gate | `screens/GateDecision.tsx` | Gestor | ✅ API |
| Painel do funil | `screens/KanbanFunnel.tsx` | Gestor | ✅ API |
| Indicadores | `screens/KPIDashboard.tsx` | Gestor, Admin (leitura) | ✅ API |
| Usuários | `screens/UsersAdmin.tsx` | Admin | ✅ API |
| Solicitações de acesso | `screens/ApprovalRequests.tsx` | Admin | ✅ API |
| Notificações, ranking | — | — | ⬜ Não existem |

### 3.14 Testes (só se houver tempo)

| ID | Item | Status | Observação |
|---|---|---|---|
| TST-01 | Score, combinação, threshold e recomendação | ⬜ PENDENTE | Hoje validado por roteiro manual da API |
| TST-02 | Autorização por rota e papel | ⬜ PENDENTE | Idem |
| TST-03 | Regras de negócio do gate | ⬜ PENDENTE | Idem |
| TST-04 | Fluxo completo | ⬜ PENDENTE | Idem |
| TST-05 | Alerta de prazo | ⬜ PENDENTE | — |
| TST-06 | Validações da submissão | ⬜ PENDENTE | — |

### 3.15 Alinhamento do TCC

| ID | Item | O código reflete? |
|---|---|---|
| DOC-01 | Quatro perfis | Sim |
| DOC-02 | Designação pelo Gestor | Sim |
| DOC-03 | "Dois perfis fundamentais" | Sim (4 papéis) |
| DOC-04 | Decisão, designação e alerta com o Gestor | Decisão e designação sim; alerta parcial (sem notificação) |
| DOC-05 | US novas do Gestor e do Admin | Sim: triagem, designação, decisão, funil, KPIs e usuários |
| DOC-06 | Primeiro estágio "Ideação" | Sim |
| DOC-07 | DER com novo papel e designação | Sim (incluir `gate_reviews` e `gate_review_evaluators` no DER) |
| DOC-08 | BPMN revisado e adaptações | Sim: avaliador separado de quem decide, 3 decisões, rodadas após Revisar, fim no Lançamento |
| DOC-09 | Sem nuvem | Sim |
| DOC-10 | Cronograma desta integração | Ver seção 6 |

---

## 4. Encontrado no código e fora da lista

| O que | Onde | Comentário |
|---|---|---|
| Aprovação de cadastros de Avaliador e Gestor | `ManageUserApprovalsUserStory.ts`, `ApprovalRequests.tsx` | Incorporado à D10 |
| Status intermediários do fluxo (aguardando triagem, designação, em avaliação, aguardando decisão) | `IdeaStatus` | Necessários para o BPMN; aparecem para o autor e no histórico |
| Sugestão de avaliadores da rodada anterior | `GateReviewQueriesUserStory.ts` | Pedido na D13 |
| Nota do parecer calculada no backend | `SubmitEvaluationUserStory.ts` | O front não consegue enviar uma nota diferente da ponderada |
| Visibilidade de ideias (só Gestor lista todas) | `ListIdeasUserStory.ts`, `GetIdeaByIdUserStory.ts` | DIV-9 |
| `authorId` imutável e autor vindo do token | `IdeaController.ts`, `UpdateIdeaController.ts` | — |

---

## 5. O que falta (só itens não FEITO)

| Bloco | Itens | Depende de |
|---|---|---|
| **B · Notificações** | NOT-01 a 05 · GAT-05, 11, 15, 24 · SUB-06 | Nada |
| **C · Anexos e entregas** | SUB-02, 04 · ACO-02, 04 · INF-04 · DER-01 (`attachments`) | Nada |
| **D · Engajamento** | ENG-01, 03, 04 · GAT-24 (pontos) | B (mesmos gatilhos) |
| **E · Departamento** | AUT-01 · ADM-01 · DER-05 · FUN-03 · SEED-01 | Decidir ADM-07 |
| **F · Acabamento** | GAT-07 · SUB-05 · FRO-02, 03, 05, 07 · INF-05 | — |
| **G · Documento do TCC** | DOC-01 a 10 | Blocos A–F |
| *Se houver tempo* | SEED-02, 05 · TST-01 a 06 | — |
| *A decidir* | GAT-12 · SUB-07 · ACO-06 · ADM-06, 07 · ENG-02 · FRO-08 · rótulo do estágio 3 | Autores |

---

## 6. Cronograma (encurtado)

O núcleo do fluxo, que era a maior parte do cronograma anterior (fundação, backoffice, triagem, designação, avaliação, consolidação e decisão), já está pronto. O restante cabe em **4 semanas**.

| Semana | Período | Entregas | Itens | Marco |
|---|---|---|---|---|
| 1 | 27/10 – 02/11 | ✅ Funil real e painel de KPIs com dados reais e filtro de período (entregue em 26/10) | Bloco A | Gestor vê o funil e os KPIs reais |
| 2 | 03/11 – 09/11 | Notificações (tabela, sino, gatilhos do BPMN) e alerta de prazo registrado no histórico | Bloco B | Cada perfil recebe as suas notificações |
| 3 | 10/11 – 16/11 | Anexos e entregas; pontos e ranking; departamento no cadastro | Blocos C, D, E | **Levantamento intermediário** |
| 4 | 17/11 – 23/11 | Acabamento visual; alinhamento do TCC; seed e testes se houver tempo | Blocos F, G | **Levantamento final** |

**Premissas:** semanas começando em 27/10/2026; a branch `feat-avanco-da-integracao` é mergeada na `dev` ao fim de cada semana. Se faltar tempo, a ordem de corte é: anexos (C) → engajamento (D) → acabamento (F); notificações e KPIs ficam, porque estão no BPMN e no Módulo 6.

---

## 7. Registro de andamento

| Data | O que foi feito | Itens |
|---|---|---|
| 26/10/2026 | Auditoria inicial e cronograma | FRO-01 |
| 26/10/2026 | Docker Compose e README | INF-01 |
| 26/10/2026 | Renomeação para MindVance | INF-03 |
| 26/10/2026 | Menus e guarda de telas em fonte única; KPIs saem do Admin exclusivo | AUT-05, ADM-05, DIV-2, DIV-3 |
| 26/10/2026 | D10: pedido de papel pendente opera como Colaborador; Admin troca papéis | AUT-01, ADM-01, ADM-02 |
| 26/10/2026 | Modelo de gates, critérios, rodadas e designação; status do fluxo | DER-03, 04, 06, 07, 08, 09, SEED-03, 04 |
| 26/10/2026 | Fluxo completo: triagem, designação, avaliação, consolidação, recomendação e decisão; fim no Lançamento; nova rodada após Revisar | GAT-01 a 04, 06, 08 a 10, 13, 14, 16 a 23, 25, ACO-05, DIV-4 a DIV-8 |
| 26/10/2026 | Exclusão de ideias removida; KPIs para Gestor e Admin (leitura); visibilidade de ideias pela matriz | D12, DIV-1, DIV-9, AUT-04 |
| 26/10/2026 | Telas: Triagem e designação, Decisão de Gate integrada, Usuários, edição da ideia, próximo passo | GAT-01, 03, 16, ACO-04, 07, ADM-02 |
| 26/10/2026 | Bloco A: funil e indicadores com dados reais, filtro de período, Gate Aging pela última movimentação; dados de exemplo removidos | FUN-01, 02, 03, 05, KPI-01 a 06, FRO-04, FRO-07 |
