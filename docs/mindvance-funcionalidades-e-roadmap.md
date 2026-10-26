# MindVance — Funcionalidades, auditoria e cronograma de integração

Fontes: TCC (seção 2.8.1, Módulos 1 a 6; User Stories; UC01 e UC02; fluxo "Da Ideia ao Lançamento"), BPMN revisado do MindVance e decisões dos autores.

**Auditoria feita em 26/10/2026** sobre a branch `feat-avanco-da-integracao` (commit `ea1298a`), que contém toda a `dev`.

---

## Como ler este documento

| Status | Significado |
|---|---|
| ✅ **FEITO** | Implementado e funcionando conforme a descrição |
| 🟡 **PARCIAL** | Existe, mas falta parte do que está descrito (a observação diz o quê) |
| ⬜ **PENDENTE** | Não existe |
| 🔴 **DIVERGENTE** | Existe, mas contradiz a descrição (a observação diz como está hoje) |
| ❓ **A DECIDIR** | Depende de decisão dos autores; a observação diz como o código trata hoje |

**Resumo dos 105 itens com ID** (sem contar DOC, que é do documento do TCC):

| ✅ Feito | 🟡 Parcial | ⬜ Pendente | 🔴 Divergente | ❓ A decidir |
|---|---|---|---|---|
| 12 | 38 | 40 | 8 | 7 |

Referências de código são relativas à raiz do repositório. "Mock" significa que a tela usa os dados de exemplo de `frontend/src/data.ts`, e não a API.

---

## 1. Decisões

### 1.1 Já tomadas (valem para todo o documento)

- **D1. Quatro perfis**, um papel por usuário:
  - **Colaborador:** cria e submete ideias, produz as entregas de cada estágio e solicita revisão de gate.
  - **Avaliador:** pontua ideias nos gates para os quais foi designado; mantém os acessos do Colaborador.
  - **Gestor de Inovação** (`GATEKEEPER` no código): é o gatekeeper. Faz a triagem em Ideação, designa avaliadores, toma a decisão final dos gates e acompanha o funil e os KPIs.
  - **Administrador:** backoffice. Gerencia usuários e papéis e mantém os parâmetros dos gates.
- **D2.** O Administrador **não decide gates, não designa avaliadores e não acessa o funil nem os KPIs**.
- **D3.** A **designação de avaliadores é do Gestor**.
- **D4.** A **decisão final é do Gestor**, com **justificativa obrigatória** em qualquer decisão.
- **D5.** Três saídas: **Aprovar** (avança), **Revisar** (volta ao Colaborador no mesmo estágio), **Rejeitar** (arquivada).
- **D6.** O **G1** é aberto por **triagem do Gestor**. Nos **G2 a G5**, quem solicita a revisão é o **Colaborador**, depois de produzir as entregas.
- **D7.** O **sistema recomenda** (score ponderado × threshold) e o **Gestor decide**, podendo reverter.
- **D8.** Nome **MindVance**; infraestrutura **só local, via Docker Compose**.
- **D9.** Termos voltados ao usuário em **pt-BR do TCC** ("usuários", "gerenciar", "registrar", "gate").

### 1.2 Decisões pendentes (responder antes da fase indicada)

As marcadas com ⚠️ **mudam a lógica do fluxo** e travam as fases seguintes.

| # | Pergunta | Como está hoje | Recomendação | Antes da fase |
|---|---|---|---|---|
| ⚠️ P1 | **Como o usuário recebe o papel?** (AUT-01, ADM-02) | No cadastro, o usuário escolhe Avaliador ou Gestor e fica `PENDING` até o Admin aprovar; Colaborador entra direto | Seguir o documento: cadastro sempre como Colaborador; o Admin atribui o papel (ADM-02). A fila de aprovação pode virar a tela de usuários | 1 |
| ⚠️ P2 | **O que acontece ao aprovar no G5?** (GAT-21) | Aprovar em Teste e Validação leva ao Lançamento **ainda "Em andamento"**; uma 6ª decisão marca "Aprovada" | Aprovar no G5 leva ao Lançamento e encerra o fluxo, com status "Aprovada"/"Lançada". Remover a 6ª decisão | 1 |
| ⚠️ P3 | **Quem pode excluir ideias?** (DER-07, GAT-23) | O Admin exclui qualquer ideia, e isso apaga avaliações e decisões em cascata | O histórico é imutável: ninguém exclui depois do G1 aberto; o autor pode excluir só antes da triagem. O Admin não exclui (D2) | 1 |
| ⚠️ P4 | **Revisar → nova rodada** (DER-09, ACO-05) | Quando o autor edita uma ideia em revisão, ela volta sozinha para "Em andamento". O avaliador **não consegue** avaliar de novo, porque a regra de duplicata é por estágio | A edição não reenvia: o autor clica em "Solicitar revisão do gate" (D6). Cada reabertura cria uma **rodada** nova, com novas designações e avaliações | 1 |
| ⚠️ GAT-13 | **Como combinar vários avaliadores?** E a comparação com o threshold usa `≥` ou `>`? | Não há consolidação; o anel do avaliador usa `≥ 7` fixo no front | Média por critério entre os avaliadores, depois Σ(média × peso); usar `≥` | 5 |
| ⚠️ GAT-14 | **O que separa "revisar" de "rejeitar"** na recomendação? | Não existe recomendação | Faixa abaixo do threshold (ex.: até 2 pontos abaixo → revisar; abaixo disso → rejeitar), configurável por gate | 6 |
| ⚠️ GAT-12 | **Avaliador atrasado:** reatribuir, quórum parcial ou aguardar? | Não há designação nem prazo; aprovar exige ao menos 1 avaliação no estágio | Permitir ao Gestor **reatribuir** o avaliador atrasado; manter a regra de "todos os designados" | 5 |
| P5 | **Nome do 3º estágio** (SEED-02) | "Plano de Negócios" (`PLANO_DE_NEGOCIOS`) | Usar "Construção do Plano de Negócios" na interface, conforme a tabela da seção 2 | 1 |
| GAT-01 | E se o Gestor **não abrir o G1**? | A ideia nem passa por triagem: vai direto para a fila dos avaliadores | Manter em Ideação, contando os dias parados (Gate Aging), sem saída automática | 4 |
| GAT-09 | O parecer pode ser **editado** depois de enviado? | Não há rota de edição | Não pode (recomendação do documento) | 5 |
| SUB-07 | Gestor e Admin **submetem ideias**? | A API aceita ideia de qualquer perfil; o menu só oferece ao Colaborador | Avaliador e Gestor sim; Admin não (perfil de backoffice) | 3 |
| ACO-06 | "Aprovada" no Mural é ter passado em qualquer gate ou ter chegado ao Lançamento? | Mostra as que chegaram ao Lançamento (aprovadas e aguardando o último gate) | Chegar ao Lançamento (casa com P2) | 3 |
| ADM-06 | Log das alterações de backoffice? | Não existe | Tabela simples `audit_logs` só se sobrar tempo | 2 |
| ADM-07 | Departamentos pela interface? | Fixos no front (`frontend/src/data.ts`); o backend não guarda departamento | Tabela `departments` com seed; CRUD pela interface só se sobrar tempo | 1 |
| ENG-02 | Pontos por "colaboração em ideias alheias"? | Não existe nada de colaboração no código | Fora do escopo desta integração | 8 |
| FRO-08 | A pasta `Create` substitui o frontend do monorepo? | **Já substituiu.** O `frontend/` é o conteúdo da `Create`, e não há outro frontend | Considerar decidido: `frontend/` é o oficial | — |

---

## 2. Fluxo ponta a ponta (BPMN) e situação atual

### 2.1 Pool "Avaliação de Ideias no Gate"

| Passo | Ator | O que o BPMN prevê | Situação hoje | Itens |
|---|---|---|---|---|
| 1 | Colaborador | Cria e submete a ideia (formulário + anexos) | ✅ Formulário integrado; anexos ⬜ | SUB-01 a 05 |
| 2 | Sistema | Registra em **Ideação** e **notifica o Gestor** | 🟡 Registra; não notifica | SUB-06, NOT-03 |
| 3 | Gestor | Triagem e **abertura do G1** | 🔴 Não existe: a ideia vai direto para a fila dos avaliadores | GAT-01 |
| 4 | Gestor | **Designa avaliadores** (o autor não pode) | ⬜ Não existe; qualquer Avaliador avalia qualquer ideia (exceto as próprias) | GAT-03, GAT-04 |
| 5 | Sistema | Notifica os designados | ⬜ | GAT-05, NOT-04 |
| 6 | Avaliadores | Nota 0–10 e comentário por critério + justificativa geral (em paralelo) | 🟡 Tela integrada; não há designação, prazo nem rodada | GAT-06 a 10 |
| 6a | Sistema | **Prazo vencido** → alerta Avaliador e Gestor, registra atraso | ⬜ | GAT-11 |
| 7 | Sistema | Consolida Σ(nota × peso), compara ao threshold, **recomenda**, notifica o Gestor | ⬜ Cada avaliação tem nota própria; não há consolidação nem threshold | GAT-13 a 15 |
| 8 | Gestor | Analisa recomendação e pareceres, **decide com justificativa** | 🟡 Backend pronto (só o Gestor, justificativa obrigatória); **tela ainda mock** | GAT-16 a 19 |
| 9 | Sistema | Registra a transição, atualiza estágio e status, notifica o autor, lança pontos | 🟡 Registra em `gate_decisions` e atualiza estágio/status; sem notificação e sem pontos | GAT-20 a 24 |
| 10a | — | **Rejeitar:** arquiva, fim | 🟡 Status "Encerrada"; histórico visível ao autor; o Admin ainda pode excluir | GAT-23 |
| 10b | Colaborador | **Revisar:** ajusta e solicita nova revisão (volta ao passo 4, mesmo gate) | 🔴 A edição reenvia sozinha; não há nova rodada nem tela de edição | ACO-04, ACO-05, DER-09 |
| 10c | Colaborador | **Aprovar antes do G5:** produz entregas e solicita o próximo gate | 🟡 A ideia avança; não há entregas nem solicitação (o botão existe, sem ação) | ACO-04, ACO-05, GAT-02 |
| 10d | — | **Aprovar no G5:** entra em Lançamento, fim | 🔴 Entra em Lançamento ainda "Em andamento" e exige uma 6ª decisão | GAT-21 |

### 2.2 Pool "Backoffice"

| Passo | Ator | O que o BPMN prevê | Situação hoje | Itens |
|---|---|---|---|---|
| 11 | Administrador | Gerencia usuários e papéis | 🟡 Só aprova/recusa os cadastros pendentes de Avaliador e Gestor | ADM-01, ADM-02 |
| 11 | Administrador | Mantém critérios, pesos, threshold e prazos | ⬜ Critérios e pesos fixos no front | ADM-03 |
| 12 | Sistema | Persiste e registra log | 🟡 Persiste; sem log | ADM-06 |

### 2.3 Estágios e gates

| Estágio | Gate seguinte | Entregas exigidas | No código |
|---|---|---|---|
| 0 · Ideação | G1 | Ideia submetida | `IDEACAO` |
| 1 · Escopo | G2 | Esboço de plano de negócios | `ESCOPO` |
| 2 · Construção do Plano de Negócios | G3 | Especificações técnicas | `PLANO_DE_NEGOCIOS` (rótulo "Plano de Negócios", ver P5) |
| 3 · Desenvolvimento | G4 | Resultados de testes e validação | `DESENVOLVIMENTO` |
| 4 · Teste e Validação | G5 | Plano de lançamento | `TESTE_E_VALIDACAO` |
| 5 · Lançamento | — | — | `LANCAMENTO` |

Estágios e gates hoje são um **enum**, não tabelas. Prazos, threshold e entregas não existem no banco.

**Critérios padrão:** Alinhamento Estratégico 30%, Viabilidade Técnica 25%, Potencial de Mercado 25%, Risco de Execução 20% (nota inversa). Hoje estão **fixos** em `frontend/src/lib/evaluations.ts` (`DEFAULT_CRITERIA`), e a nota inversa do Risco **não é aplicada**.

---

## 3. Funcionalidades e auditoria

### 3.1 Infraestrutura e base

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| INF-01 | `docker-compose.yml` sobe o PostgreSQL; o projeto roda seguindo o README | ⬜ PENDENTE | `README.md` (seção "Como rodar") | Não há `docker-compose.yml`; o README usa `docker run` |
| INF-02 | Nenhuma referência a AWS, EC2, Cognito ou nuvem | ✅ FEITO | busca em `backend/`, `frontend/src`, `README.md` | Nada encontrado no repositório (o TCC é tratado em DOC-09) |
| INF-03 | Nome **MindVance** visível; sem "IMS" ou "Ideavance" | ⬜ PENDENTE | `frontend/src/screens/Login.tsx:84`, `frontend/src/components/Sidebar.tsx:78`, `backend/package.json`, `README.md:1` | "IMS" no login e no menu; "idevance" no README, no `package.json` e no nome do banco; `<title>` "Figma Make App"; chave `ims.session` |
| INF-04 | `.env.example` com banco, segredo JWT e limite de upload | 🟡 PARCIAL | `backend/.env.example`, `frontend/.env.example` | Banco e JWT documentados; falta o limite de upload |
| INF-05 | Erros padronizados, com mensagens por campo | ⬜ PENDENTE | controllers em `backend/src/presentation/controllers/` | Cada controller monta `{ error }` do seu jeito; mensagens misturam inglês e português; sem erro por campo |

### 3.2 Modelo de dados (DER)

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| DER-01 | Entidades do DER no `schema.prisma` | 🟡 PARCIAL | `backend/prisma/schema.prisma` | Existem `users`, `ideas`, `evaluations` (≈ `gate_evaluations`, com critérios em JSON) e `gate_decisions` (≈ `stage_transitions`). Faltam `departments`, `stages`, `gates`, `gate_criteria`, `attachments`, `gate_criteria_scores`, `notifications` e `engagement_points` |
| DER-02 | Enum de papéis com 4 valores | ✅ FEITO | `schema.prisma` (`UserRole`), migrations `20261020220000` e `20261020230000` | `COLLABORATOR`, `EVALUATOR`, `GATEKEEPER`, `ADMIN` |
| DER-03 | `gates` com `deadline_days` e threshold | ⬜ PENDENTE | — | Não há tabela de gates |
| DER-04 | `gate_criteria` por gate, pesos somando 100 | ⬜ PENDENTE | `frontend/src/lib/evaluations.ts` | Critérios fixos no front, iguais para todos os gates |
| DER-05 | `ideas` com título, problema, solução, área, impacto, recursos, JSONB, estágio e status | 🟡 PARCIAL | `schema.prisma` (`Idea`), `frontend/src/lib/ideas.ts` (`createIdea`) | Título, JSONB, estágio e status (4 valores) existem. Solução fica em `description`; problema, departamento, impacto e recursos ficam em `extra_fields`, sem coluna própria |
| DER-06 | Registro de **avaliadores designados** por ideia/gate | ⬜ PENDENTE | — | Não existe |
| DER-07 | `stage_transitions` completa e **imutável** | 🟡 PARCIAL | `GateDecision` em `schema.prisma`; `DeleteIdeaUserStory.ts`, `PrismaIdeaRepository.delete` | Guarda ideia, estágio de origem, decisão, justificativa, pontos de revisão, responsável e data. Faltam o gate e o estágio de destino. Não há rota de update/delete, **mas excluir a ideia apaga as decisões em cascata** (ver P3) |
| DER-08 | Nota e comentário por critério + justificativa; 1 avaliação por avaliador/ideia/**rodada** | 🟡 PARCIAL | `Evaluation` (`criteria` JSON), `SubmitEvaluationUserStory.ts` | Critérios (nome, peso, nota, comentário) em JSON, com o peso do momento. A unicidade é por **estágio**, não por rodada |
| DER-09 | Ideia em revisão passa de novo pelo mesmo gate (nova rodada) | 🔴 DIVERGENTE | `SubmitEvaluationUserStory.ts` (regra de duplicata) | A regra "1 avaliação por avaliador e estágio" **impede** a nova rodada depois de Revisar (ver P4) |

### 3.3 Seed

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| SEED-01 | Departamentos padrão | ⬜ PENDENTE | `frontend/src/data.ts` (`departments`) | Não há seed; os departamentos estão fixos no front |
| SEED-02 | 6 estágios com os nomes da seção 2 | ⬜ PENDENTE | `IdeaStage` em `schema.prisma` | Estágios são enum, não seed; nome do 3º estágio diverge (P5) |
| SEED-03 | 5 gates com prazo e threshold | ⬜ PENDENTE | — | — |
| SEED-04 | 4 critérios por gate, 30/25/25/20 | ⬜ PENDENTE | `frontend/src/lib/evaluations.ts` | Os pesos 30/25/25/20 estão corretos, mas fixos no front |
| SEED-05 | Um usuário de cada perfil | ⬜ PENDENTE | `README.md` (passo 5) | Cada dev cria os usuários na mão; o Admin só pode ser criado por outro Admin (`POST /users/admin`), e não há como criar o primeiro sem mexer no banco |

### 3.4 Autenticação e controle de acesso

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| AUT-01 | Cadastro com nome, e-mail, senha e departamento; papel padrão Colaborador | 🟡 PARCIAL | `CreateUserUserStory.ts`, `PrismaUserRepository.ts:19-22`, `Login.tsx` | Padrão é Colaborador. O departamento é pedido na tela, mas **não é salvo**. O cadastro deixa escolher Avaliador ou Gestor (com aprovação do Admin; ver P1) |
| AUT-02 | Login com bcrypt; JWT com id e papel | ✅ FEITO | `LoginUserStory.ts` | JWT de 1 dia com `sub` e `role`; bloqueia contas não aprovadas |
| AUT-03 | Middleware JWT nas rotas protegidas | ✅ FEITO | `ensureAuthenticated.ts`, `routes/index.ts` | Aplicado a tudo depois de `/auth` e `/users`; relê o usuário no banco a cada requisição (papel e aprovação sempre atualizados) |
| AUT-04 | RBAC com a matriz da seção 3.12 | 🟡 PARCIAL | `ensureAdminRole.ts`, `ensureGatekeeperRole.ts`, regras nas UserStories | Existem guardas de Admin e Gestor. Desvios da matriz: KPIs só para Admin (deveria ser Gestor); `GET /ideas` e `GET /ideas/:id` abertos a qualquer perfil; avaliação sem checar designação |
| AUT-05 | Rotas protegidas por papel e menu por perfil no front | 🟡 PARCIAL | `Sidebar.tsx` (`navByRole`), `App.tsx` | Há menu por perfil, mas: o Admin vê funil e KPIs; o Gestor não vê KPIs; o Avaliador não tem Nova Ideia, Minhas Ideias nem Mural (D1); só as telas `dashboard` e `approvals` têm guarda de rota |
| AUT-06 | Logout e token expirado → login | ✅ FEITO | `lib/auth.ts` (`loadSession`, `clearSession`), telas integradas tratam 401 | — |

### 3.5 Módulo 1 — Submissão de ideias

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| SUB-01 | Formulário completo; informa que entra em Ideação | ✅ FEITO | `frontend/src/screens/NewIdea.tsx`, `POST /api/ideas` | 3 passos; autor vem do token |
| SUB-02 | Upload de anexos em `attachments` | ⬜ PENDENTE | `NewIdea.tsx` (área desabilitada) | O backend não recebe arquivos; a área mostra "em breve" |
| SUB-03 | UC01 FA01: validação por campo; nada é registrado faltando campo | 🟡 PARCIAL | `NewIdea.tsx` (`validateStep1`), `CreateIdeaUserStorie.ts` | O front valida por campo. O backend só valida o título: problema, solução e departamento podem chegar vazios pela API |
| SUB-04 | UC01 FA02: anexo inválido sem perder os campos | ⬜ PENDENTE | — | Depende de SUB-02 |
| SUB-05 | Após submeter, vai para "Minhas ideias" com o status | 🟡 PARCIAL | `NewIdea.tsx` (tela de sucesso) | Mostra uma tela de sucesso com o botão "Ver minhas ideias", sem redirecionar |
| SUB-06 | Registra em Ideação e **notifica o Gestor** | 🟡 PARCIAL | `CreateIdeaUserStorie.ts` | Registra em `IDEACAO`/`EM_ANDAMENTO`; não há notificação |
| SUB-07 | Avaliadores também submetem; Gestor/Admin a decidir | ❓ A DECIDIR | `Sidebar.tsx`, `idea.routes.ts` | A API aceita ideia de qualquer perfil; só o menu do Colaborador oferece a tela. O Avaliador **deveria** ter o acesso (D1) e não tem |

### 3.6 Acompanhamento da ideia

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| ACO-01 | "Minhas ideias" com estágio e status | ✅ FEITO | `MyIdeas.tsx`, `GET /api/ideas?authorId=` | Estados de carregamento, vazio e erro |
| ACO-02 | Detalhe com conteúdo, anexos e timeline de `stage_transitions` | 🟡 PARCIAL | `IdeaDetail.tsx`, `GET /ideas/:id/evaluations`, `GET /ideas/:id/gate-decisions` | A timeline junta submissão, avaliações e decisões (data, responsável, decisão, feedback). Sem anexos; a fonte é `gate_decisions` |
| ACO-03 | Pontos a ajustar em destaque quando em Revisar | ✅ FEITO | `IdeaDetail.tsx` (aviso "Devolvida para revisão") | — |
| ACO-04 | Autor edita a ideia e anexa entregas (Revisar e próximo estágio) | 🟡 PARCIAL | `UpdateIdeaUserStory.ts`, `PUT /api/ideas/:id` | O backend deixa o autor editar na Ideação e em Revisar. **Não há tela de edição**, não há entregas, e editar uma ideia aprovada para o próximo estágio é bloqueado |
| ACO-05 | "Solicitar revisão do gate": só autor, só G2–G5, só fora de avaliação | 🔴 DIVERGENTE | `IdeaDetail.tsx` | Aparece para o autor em **qualquer** estágio "Em andamento", inclusive Ideação (contraria D6), e **não tem ação**: não há rota no backend |
| ACO-06 | Vitrine de aprovadas para todos os perfis | ❓ A DECIDIR | `ApprovedBoard.tsx`, `GET /ideas?stage=LANCAMENTO` | Integrado; mostra as que chegaram ao Lançamento. **Só o menu do Colaborador** tem o Mural, mas a matriz pede todos os perfis |
| ACO-07 | Autor vê em que estágio está e qual o próximo passo | 🟡 PARCIAL | `GateRail`, `GateBadge` em `MyIdeas.tsx` e `IdeaDetail.tsx` | Mostra o estágio e o gate; não diz "próximo passo esperado" |

### 3.7 Módulo 2 — Funil (Gestor)

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| FUN-01 | Kanban com 6 colunas e contagem | 🟡 PARCIAL | `KanbanFunnel.tsx` | Tela pronta, **mock** |
| FUN-02 | Card com título, autor, departamento, status e gate | 🟡 PARCIAL | `KanbanFunnel.tsx` | Mock; a API já devolve `authorName`, `status` e departamento |
| FUN-03 | Filtros por departamento, período e status | 🟡 PARCIAL | `ListIdeasController.ts`, `PrismaIdeaRepository.findAll` | A API filtra por estágio, status, período e autor. Falta filtrar por departamento (está no JSON). Front mock |
| FUN-04 | Funil completo só para o Gestor; Avaliador vê só as atribuídas | 🔴 DIVERGENTE | `Sidebar.tsx` | Admin, Gestor e Avaliador veem o mesmo funil (mock) |
| FUN-05 | Gate Aging no card | 🟡 PARCIAL | `GateAgingBadge.tsx`, `lib/ideaVisuals.ts` | O componente existe e conta desde a última movimentação; no funil, só com mock |

### 3.8 Módulo 3 — Ciclo de gate

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| GAT-01 | Fila de **triagem** e abertura do G1 pelo Gestor | 🔴 DIVERGENTE | `GetEvaluationQueueUserStory.ts` | Não há triagem: toda ideia "Em andamento" cai na fila de todos os Avaliadores logo após a submissão |
| GAT-02 | Fila de **solicitações de revisão** (G2–G5) | ⬜ PENDENTE | — | Depende de ACO-05 |
| GAT-03 | Tela de **designação** de avaliadores pelo Gestor | ⬜ PENDENTE | — | Depende de DER-06 |
| GAT-04 | O autor não pode ser designado (regra no backend) | 🟡 PARCIAL | `SubmitEvaluationUserStory.ts` | O backend impede o autor de **avaliar** a própria ideia; falta a regra na designação |
| GAT-05 | Designação notifica os avaliadores | ⬜ PENDENTE | — | — |
| GAT-06 | Fila do Avaliador só com os gates em que foi designado, com prazo | 🔴 DIVERGENTE | `GetEvaluationQueueUserStory.ts`, `GateEvaluation.tsx` | Mostra **todas** as ideias de outros autores ainda não avaliadas por ele no estágio. Sem prazo: exibe "aguardando há X dias" |
| GAT-07 | Tela de avaliação: conteúdo, histórico ao lado, slider 0–10, peso, comentário e justificativa | 🟡 PARCIAL | `GateEvaluation.tsx` | Tem resumo da ideia, 4 critérios com peso, slider, comentário e justificativa. Falta o histórico ao lado |
| GAT-08 | UC02 FA01: bloqueia sem nota em critério ou sem justificativa | 🟡 PARCIAL | `GateEvaluation.tsx`, `SubmitEvaluationUserStory.ts` | A justificativa é obrigatória no front e no back. As notas começam em 0, então "faltar nota" não é detectado |
| GAT-09 | Um parecer por avaliador e rodada; só designados avaliam | 🟡 PARCIAL | `SubmitEvaluationUserStory.ts` | Um por avaliador e **estágio** (409 em duplicata); não verifica designação; não há edição (conforme recomendação) |
| GAT-10 | Verdict Ring ao vivo; corrigir o empate com a regra do backend | 🟡 PARCIAL | `VerdictRing.tsx:21`, `lib/evaluations.ts` (`PASS_THRESHOLD = 7`) | Reage ao vivo. Usa `score >= 7` fixo no front; o backend não tem threshold (depende de GAT-13) |
| GAT-11 | UC02 FA02: prazo vencido notifica e registra atraso | ⬜ PENDENTE | — | — |
| GAT-12 | Avaliador atrasado | ❓ A DECIDIR | `DecideGateUserStory.ts` | Hoje não há designados; aprovar exige ao menos 1 avaliação no estágio atual |
| GAT-13 | Consolidação Σ(nota × peso) quando todos os designados concluem | ⬜ PENDENTE | `lib/evaluations.ts` (`weightedScore`) | Cada avaliador gera a própria nota ponderada no front; não há consolidação no backend |
| GAT-14 | Recomendação aprovar/revisar/rejeitar | ⬜ PENDENTE | — | — |
| GAT-15 | Notifica o Gestor quando o gate está pronto | ⬜ PENDENTE | — | — |
| GAT-16 | Painel de decisão com score, recomendação e pareceres | 🟡 PARCIAL | `GateDecision.tsx` | A tela existe (anel, pareceres), mas é **mock**. A API já fornece os pareceres (`GET /ideas/:id/evaluations`) |
| GAT-17 | Três botões; confirmar só com justificativa | 🟡 PARCIAL | `DecideGateUserStory.ts`, `GateDecision.tsx` | O backend exige justificativa em qualquer decisão e aceita as 3 saídas. A tela é mock (`setTimeout`), sem chamar a API |
| GAT-18 | Decidir contra a recomendação, registrando as duas | ⬜ PENDENTE | — | Depende de GAT-14 |
| GAT-19 | Só o Gestor decide (backend bloqueia Admin e Avaliador) | ✅ FEITO | `ensureGatekeeperRole.ts`, `DecideGateUserStory.ts` | Verificado no middleware e na UserStory |
| GAT-20 | Toda decisão grava a transição | 🟡 PARCIAL | `gate_decisions` | Grava responsável, data, decisão, justificativa e estágio de origem; faltam o gate e o estágio de destino |
| GAT-21 | Aprovar avança; aprovar no **G5** leva ao Lançamento | 🔴 DIVERGENTE | `DecideGateUserStory.ts` | Aprovar em Teste e Validação leva ao Lançamento **"Em andamento"**, e é preciso uma 6ª aprovação para "Aprovada" (ver P2) |
| GAT-22 | Revisar: fica no estágio, em revisão, volta ao Colaborador | ✅ FEITO | `DecideGateUserStory.ts` | Status `EM_REVISAO`; sai da fila dos avaliadores; pontos de revisão gravados |
| GAT-23 | Rejeitar: arquiva, sai do funil, histórico preservado | 🟡 PARCIAL | `DecideGateUserStory.ts`, `DeleteIdeaUserStory.ts` | Status `REJEITADA` e histórico visível. O Admin ainda pode excluir (apaga o histórico); o funil é mock |
| GAT-24 | Notifica o autor e lança pontos | ⬜ PENDENTE | — | — |
| GAT-25 | Ciclo nos 5 gates, com nova rodada após Revisar | 🟡 PARCIAL | testes manuais pela API | O percurso G1→Lançamento funciona; a nova rodada após Revisar é bloqueada (DER-09) |

### 3.9 Módulo 5 — Notificações

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| NOT-01 | Notificações persistidas, com não lidas e "marcar como lida" | ⬜ PENDENTE | — | — |
| NOT-02 | Autor notificado a cada mudança de status | ⬜ PENDENTE | — | — |
| NOT-03 | Gestor notificado (ideia nova, solicitação, gate pronto, atraso) | ⬜ PENDENTE | — | — |
| NOT-04 | Avaliador notificado (designação, prazo vencido) | ⬜ PENDENTE | — | — |
| NOT-05 | Notificação com link para o item | ⬜ PENDENTE | — | — |

### 3.10 Módulo 5 — Engajamento e gamificação

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| ENG-01 | Pontos por submissão e por ideia aprovada | ⬜ PENDENTE | — | — |
| ENG-02 | Pontos por colaboração em ideias alheias | ❓ A DECIDIR | — | Não existe nada de colaboração no código |
| ENG-03 | Ranking interno | ⬜ PENDENTE | — | — |
| ENG-04 | Total de pontos no perfil ou cabeçalho | ⬜ PENDENTE | — | — |

### 3.11 Módulo 6 — KPIs (só Gestor)

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| KPI-01 | Ideias submetidas por período | 🟡 PARCIAL | `GetInnovationMetricsUserStory.ts`, `KPIDashboard.tsx` | A API dá o total geral, sem recorte por período; o painel é mock |
| KPI-02 | Conversão entre estágios | ⬜ PENDENTE | — | Os dados existem em `gate_decisions` |
| KPI-03 | Tempo médio em cada estágio | ⬜ PENDENTE | — | Calculável a partir de `gate_decisions` |
| KPI-04 | Distribuição por departamento | 🟡 PARCIAL | `GetInnovationMetricsUserStory.ts` | A API agrupa por departamento (`extraFields.department`); o painel é mock |
| KPI-05 | Status dos projetos aprovados em desenvolvimento | ⬜ PENDENTE | — | — |
| KPI-06 | Painel só para o Gestor, com filtro de período | 🔴 DIVERGENTE | `idea.routes.ts` (`/metrics` com `ensureAdminRole`), `Sidebar.tsx`, `App.tsx` | Hoje é **só do Administrador**, no backend e no menu (contraria D2) |

### 3.12 Backoffice (Administrador)

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| ADM-01 | Lista de usuários (nome, e-mail, departamento, papel) | 🟡 PARCIAL | `ApprovalRequests.tsx`, `GET /users/approvals/pending` | Lista só os cadastros **pendentes**; não há lista geral; departamento não existe |
| ADM-02 | Atribuir papel pela interface (fim do Prisma Studio) | 🟡 PARCIAL | `ManageUserApprovalsUserStory.ts`, `POST /users/admin` | O Admin aprova ou recusa o papel **pedido no cadastro** e pode criar usuários de qualquer papel pela API. Não há troca de papel de quem já existe |
| ADM-03 | Configurar critérios, pesos (soma 100), threshold e prazo por gate | ⬜ PENDENTE | — | Depende de DER-03/04 |
| ADM-04 | Mudar critérios não altera avaliações enviadas | 🟡 PARCIAL | `Evaluation.criteria` | Cada avaliação já guarda nome, peso e nota no momento do envio; falta a configuração em si |
| ADM-05 | Admin não acessa funil, KPIs, triagem, designação nem decisão | 🔴 DIVERGENTE | `Sidebar.tsx`, `idea.routes.ts` | O Admin acessa o **funil** e os **KPIs** (que só ele acessa). A decisão está corretamente bloqueada |
| ADM-06 | Log de alterações do backoffice | ❓ A DECIDIR | — | Não existe |
| ADM-07 | Departamentos pela interface | ❓ A DECIDIR | `frontend/src/data.ts` | Fixos no front; o backend não guarda departamento |

**Matriz de permissões — situação atual (backend)**

| Ação | Esperado | Hoje |
|---|---|---|
| Submeter ideia | Colab., Aval. (Gestor/Admin a decidir) | Qualquer perfil (sem guarda) |
| Ver as próprias ideias | Colab., Aval. | Qualquer perfil; `GET /ideas` lista **todas** as ideias para qualquer perfil |
| Ver ideias aprovadas | Todos | Todos (API); só o Colaborador tem a tela |
| Solicitar revisão de gate | Colab., Aval. (próprias, G2–G5) | Não existe |
| Triagem e abertura do G1 | Gestor | Não existe |
| Designar avaliadores | Gestor | Não existe |
| Avaliar | Aval. designado, não autor | Qualquer Avaliador, não autor |
| Decidir gate | Gestor | ✅ Gestor |
| Ver funil completo | Gestor | Não há API de funil; a tela (mock) aparece para Admin, Gestor e Avaliador |
| KPIs | Gestor | 🔴 Admin |
| Ranking | Todos | Não existe |
| Usuários e papéis | Admin | Admin (só aprovações pendentes) |
| Parâmetros dos gates | Admin | Não existe |
| Editar ideia | (não está na matriz) | Só o autor, na Ideação ou em Revisar |
| Excluir ideia | (não está na matriz) | Autor na Ideação; Admin sempre (ver P3) |

### 3.13 Frontend e integração com a API

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| FRO-01 | Inventário das telas | ✅ FEITO | seção 3.13.1 abaixo | — |
| FRO-02 | Telas necessárias por perfil | 🟡 PARCIAL | seção 3.13.1 | Faltam: notificações, ranking, edição de ideia, triagem, solicitações, designação, usuários e papéis, configuração dos gates |
| FRO-03 | Cliente da API: URL por env, JWT, 401/403, erros por campo | 🟡 PARCIAL | `frontend/src/lib/api.ts` | URL via `VITE_API_URL`, JWT e 401 → login nas telas integradas. Não há tratamento central de 403 nem erros por campo |
| FRO-04 | Mocks substituídos pela API, tela a tela | 🟡 PARCIAL | seção 3.13.1 | Ainda mock: Funil, Decisão de Gate e KPIs |
| FRO-05 | Assinaturas visuais (Gate Rail com marcadores, Verdict Ring, Weighted Sliders, Real Funnel, Stage Weight, Gate Aging) | 🟡 PARCIAL | `components/` | Todos existem. Faltam os **marcadores de gate** no `GateRail`; o Verdict Ring depende de GAT-10; Real Funnel e Stage Weight só com mock |
| FRO-06 | Reprovação com tratamento neutro e justificativa preservada | ✅ FEITO | `StatusBadge.tsx` ("Encerrada nesta etapa", cinza), `IdeaDetail.tsx` | — |
| FRO-07 | Estados de carregamento, vazio e erro | 🟡 PARCIAL | `MyIdeas.tsx`, `GateEvaluation.tsx`, `ApprovedBoard.tsx`, `ApprovalRequests.tsx` | Presentes nas telas integradas; as telas mock não têm |
| FRO-08 | `Create` substitui o frontend do monorepo? | ❓ A DECIDIR | `frontend/` | Já substituiu: é o único frontend (ver seção 1.2) |

#### 3.13.1 Inventário de telas (FRO-01)

| Tela | Arquivo | Perfil(is) no menu hoje | Fonte de dados |
|---|---|---|---|
| Login e cadastro | `screens/Login.tsx` | — | ✅ API |
| Nova ideia | `screens/NewIdea.tsx` | Colaborador | ✅ API |
| Minhas ideias | `screens/MyIdeas.tsx` | Colaborador | ✅ API |
| Detalhe da ideia + timeline | `screens/IdeaDetail.tsx` | Todos (ao abrir uma ideia) | ✅ API (mock quando aberto pelo Funil) |
| Mural de aprovadas | `screens/ApprovedBoard.tsx` | Colaborador | ✅ API |
| Fila de avaliações + avaliação | `screens/GateEvaluation.tsx` | Avaliador | ✅ API |
| Solicitações de cadastro | `screens/ApprovalRequests.tsx` | Administrador | ✅ API |
| Painel do funil (Kanban) | `screens/KanbanFunnel.tsx` | Avaliador, Gestor, Administrador | ⚠️ Mock |
| Decisão de gate | `screens/GateDecision.tsx` | Gestor | ⚠️ Mock |
| Indicadores (KPIs) | `screens/KPIDashboard.tsx` | Administrador | ⚠️ Mock |
| Notificações, ranking, edição de ideia, triagem, solicitações de revisão, designação, usuários, configuração de gates | — | — | ⬜ Não existem |

### 3.14 Testes

| ID | Item | Status | Evidência | Observação |
|---|---|---|---|---|
| TST-01 | Unitários de score, combinação, threshold (empate) e recomendação | ⬜ PENDENTE | — | Não há framework de testes instalado |
| TST-02 | Autorização: cada rota × 4 papéis | ⬜ PENDENTE | — | — |
| TST-03 | Regras de negócio do gate | ⬜ PENDENTE | — | — |
| TST-04 | Integração do fluxo completo (com Revisar e Rejeitar) | ⬜ PENDENTE | — | Feito só manualmente, pela API |
| TST-05 | Alerta de prazo vencido | ⬜ PENDENTE | — | — |
| TST-06 | Validações da submissão | ⬜ PENDENTE | — | — |

### 3.15 Alinhamento do TCC (documento)

Não são itens de código. A coluna indica se o **código** já reflete a decisão.

| ID | Item | O código reflete? |
|---|---|---|
| DOC-01 | Módulo 4 com os quatro perfis | Sim: 4 papéis no enum e no menu |
| DOC-02 | Designação de avaliadores passa ao Gestor | Não se aplica ainda: não há designação |
| DOC-03 | Corrigir os "dois perfis fundamentais" (4.3.1) | Sim: 4 papéis |
| DOC-04 | US018/US020/UC02: decisão, designação e alerta com o Gestor | Parcial: a decisão é do Gestor; designação e alerta não existem |
| DOC-05 | US novas do Gestor e do Administrador | Parcial: decisão (Gestor) e aprovação de cadastros (Admin) existem |
| DOC-06 | Primeiro estágio "Ideação" | Sim (`IDEACAO`) |
| DOC-07 | DER com o novo papel e a designação | Parcial: papel sim; designação não |
| DOC-08 | BPMN revisado e adaptações do Stage-Gate | Parcial: avaliador separado de quem decide e 3 decisões sim; a 6ª decisão no Lançamento contraria o BPMN (P2) |
| DOC-09 | Seção 3.2 sem AWS | O repositório não tem referências |
| DOC-10 | Cronograma com a(s) sprint(s) desta integração | Ver seção 6 |

---

## 4. Encontrado no código e fora da lista

| O que | Onde | Comentário |
|---|---|---|
| **Aprovação de cadastros**: Avaliador e Gestor ficam `PENDING` até o Admin aprovar; login e API bloqueados enquanto isso | `PrismaUserRepository.ts`, `ManageUserApprovalsUserStory.ts`, `ensureAuthenticated.ts`, `ApprovalRequests.tsx` | Conflita com AUT-01/ADM-02 (ver P1) |
| Criação de usuários de qualquer papel pelo Admin (`POST /users/admin`) | `user.routes.ts` | Útil para ADM-02; não tem tela |
| Regras de edição e exclusão de ideias | `UpdateIdeaUserStory.ts`, `DeleteIdeaUserStory.ts` | Editar: autor, na Ideação ou em Revisar (e a edição reenvia ao gate). Excluir: autor na Ideação, Admin sempre (ver P3 e P4) |
| `authorId` imutável e autor sempre vindo do token | `IdeaController.ts`, `UpdateIdeaController.ts` | Correção de segurança |
| Uma avaliação por avaliador e estágio (409) | `SubmitEvaluationUserStory.ts` | Precisa virar "por rodada" (DER-08/09) |
| Validação de nota entre 0 e 10 (avaliação e cada critério) | `SubmitEvaluationUserStory.ts` | Coerente com GAT-07 |
| Botão "Solicitar revisão do próximo gate" sem ação | `IdeaDetail.tsx` | Base para ACO-05 |
| Sessão do front guardada no navegador (`ims.session`) | `lib/auth.ts` | Renomear junto com INF-03 |
| Rota antiga de avanço de estágio (`PATCH /ideas/:id/stage`) | removida em `fb17206` | Correto: só a decisão de gate move a ideia |

---

## 5. Roadmap reordenado (só o que não está FEITO)

Ordem pelas dependências. Cada fase só fecha quando o fluxo dela funciona **de ponta a ponta na interface**. As fases 3 a 7 podem se sobrepor.

| Fase | Conteúdo | Itens | Pronto quando |
|---|---|---|---|
| **0 · Decisões** | Responder a seção 1.2 (prioridade às marcadas ⚠️) | P1–P5, GAT-12/13/14, SUB-07, ACO-06, GAT-01/09 | Decisões registradas neste arquivo |
| **1 · Fundação** | Docker Compose, renomear para MindVance, `.env.example`, padrão de erros. Modelo: tabelas `departments`, `stages`, `gates` (prazo, threshold), `gate_criteria`, designação, rodadas, transição completa e imutável. Seed com os 4 perfis. Corrigir o RBAC: KPIs e funil só do Gestor; Avaliador herda o Colaborador; departamento salvo no cadastro | INF-01, 03, 04, 05 · DER-01, 03 a 09 · SEED-01 a 05 · AUT-01, 04, 05 · ADM-05 · KPI-06 · FUN-04 · GAT-21 | `docker compose up` + seed; login com os 4 perfis, cada um vendo só o seu menu |
| **2 · Backoffice** | Lista de usuários, troca de papel, configuração de gates | ADM-01 a 04 (06, 07 se decidido) | Promover um usuário a Avaliador ou Gestor e alterar pesos de um gate pela interface |
| **3 · Colaborador** | Tela de edição; solicitar revisão (G2–G5); anexos e entregas; redirecionamento; próximo passo; validação no backend | SUB-02 a 06 · ACO-02, 04, 05, 07 · ACO-06 | Colaborador ajusta uma ideia em Revisar, anexa entregas e solicita o gate |
| **4 · Triagem e designação** | Fila de triagem e abertura do G1; fila de solicitações; designação (autor bloqueado); funil real | GAT-01 a 05 · FUN-01 a 05 | Gestor abre o G1, designa 2 avaliadores; o autor é recusado |
| **5 · Avaliação** | Fila só dos designados, com prazo; rodada; histórico ao lado; bloqueio sem nota; alerta de prazo | GAT-06 a 11 (12 se decidido) | Dois avaliadores enviam pareceres; o alerta de prazo dispara |
| **6 · Consolidação e decisão** | Score consolidado, threshold, recomendação; tela de decisão real; transição completa; nova rodada após Revisar | GAT-10, 13 a 18, 20, 23 a 25 | Ideia vai de G1 a G5 até Lançamento, com um Revisar e um Rejeitar no caminho |
| **7 · Notificações** | Tabela, sino com não lidas, gatilhos e links | NOT-01 a 05 · GAT-05, 15, 24 · SUB-06 | Cada perfil recebe as notificações da seção 3.9 |
| **8 · Engajamento e KPIs** | Pontos, ranking, painel do Gestor com dados reais | ENG-01, 03, 04 · KPI-01 a 05 | Ranking e painel do Gestor com dados reais |
| **9 · Acabamento do frontend** | Marcadores do Gate Rail, telas restantes, estados de erro, 403 central | FRO-02 a 05, 07 | Nenhuma tela usa `data.ts` |
| **10 · Testes** | Framework + testes de regra, autorização e fluxo | TST-01 a 06 | Testes passando, incluindo o fluxo completo |
| **11 · Documento** | Alinhamento final do TCC | DOC-01 a 10 | TCC, BPMN, DER e código contam a mesma história |

**Por que essa ordem difere do roadmap original:** a fase 1 concentra todas as mudanças de modelo (gates, designação, rodadas, transição), porque as fases 3 a 6 dependem delas e mexer no schema várias vezes gera migrations conflitantes entre colegas. As 8 divergências também entram na fase 1, porque são rápidas e afetam o que cada perfil vê.

---

## 6. Cronograma

**Premissas** (ajustar com o time): sprints de **1 semana**, começando em **27/10/2026**; a branch `feat-avanco-da-integracao` concentra a integração e é mergeada na `dev` ao fim de cada semana; as sprints 10 e 11 do TCC correspondem às semanas 6 e 7. Se a data de entrega do TCC for antes de 20/12, comprimir as semanas 5–7.

| Semana | Período | Fases | Entregas principais | Marco |
|---|---|---|---|---|
| 1 | 27/10 – 02/11 | 0 · 1 (parte A) | Decisões da seção 1.2; Docker Compose; renomear para MindVance; seed; correção das 8 divergências de RBAC/menu | Login com os 4 perfis, menus corretos |
| 2 | 03/11 – 09/11 | 1 (parte B) · 2 | Novo modelo (gates, critérios, threshold, designação, rodadas, transições); telas de usuários e de configuração dos gates | Admin promove usuário e configura gate pela interface |
| 3 | 10/11 – 16/11 | 3 · 4 | Edição da ideia, solicitar revisão, anexos; triagem, designação e funil real | Gestor abre o G1 e designa avaliadores |
| 4 | 17/11 – 23/11 | 5 · 6 (parte A) | Fila só dos designados, prazo e alerta; score consolidado e recomendação | Dois pareceres geram uma recomendação |
| 5 | 24/11 – 30/11 | 6 (parte B) · 7 | Tela de decisão real; nova rodada após Revisar; notificações | **Levantamento intermediário:** fluxo G1→Lançamento na interface, com Revisar e Rejeitar |
| 6 | 01/12 – 07/12 | 8 (Sprint 10) | Pontos, ranking e painel de KPIs do Gestor | Painel com dados reais |
| 7 | 08/12 – 14/12 | 9 · 10 (Sprint 11) | Acabamento visual; testes de regra, autorização e fluxo | Testes passando |
| 8 | 15/12 – 21/12 | 11 · folga | Alinhamento do TCC; correções finais | **Levantamento final:** o que foi entregue e o que ficou pendente |

**Levantamentos:** ao fim das semanas 5 e 8, atualizar a coluna "Status" da seção 3 e o resumo do início deste documento. O que não couber vira a lista de pendências declarada no TCC.
