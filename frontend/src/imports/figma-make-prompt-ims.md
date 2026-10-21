# Prompt para Figma Make — IMS (Innovation Management Software)

> Copie e cole o conteúdo abaixo diretamente no Figma Make. Ele descreve o produto,
> os 3 perfis de usuário, a identidade visual e as telas a serem geradas.

---

## Contexto do produto

Estou criando o **IMS (Innovation Management Software)** — nome de marca ainda
provisório —, uma plataforma web B2B interna que automatiza o **modelo
Stage-Gate** de gestão de inovação corporativa. Colaboradores de uma empresa
submetem ideias, que percorrem um funil de 6 estágios (Ideação → Escopo →
Construção do Plano de Negócios → Desenvolvimento → Teste e Validação →
Lançamento). A transição entre estágios só acontece após a aprovação em um
**gate de decisão**: avaliadores designados pontuam a ideia em critérios
ponderados (alinhamento estratégico, viabilidade técnica, potencial de
mercado, risco de execução), o sistema calcula uma pontuação consolidada e
gera uma recomendação automática, e um Administrador toma a decisão final
(aprovar / revisar / rejeitar) com justificativa obrigatória.

Este é um produto **sério, corporativo e orientado a dados** — não é um app
consumer. Pense em algo com a densidade de informação de um Linear ou Notion,
mas com a linguagem visual de uma ferramenta de gestão de portfólio/inovação:
confiável, estruturado, com hierarquia visual clara para números e status.

## Perfis de usuário (3 papéis distintos, com telas diferentes)

1. **Colaborador** — submete ideias, acompanha o status das próprias
   submissões numa timeline visual, e navega por um mural de ideias já
   aprovadas na empresa.
2. **Avaliador** — recebe uma fila de avaliações de gate pendentes, preenche
   um formulário estruturado com notas ponderadas por critério e um
   comentário justificando cada nota.
3. **Administrador** — enxerga o funil completo em formato kanban, recebe os
   gates com todas as avaliações concluídas e toma a decisão final de
   aprovação/rejeição/revisão, sempre com justificativa obrigatória.

## Identidade visual (use exatamente esta base, mas capriche na execução)

- **Paleta**: fundo em tons de slate bem escuro (`#0b1120` → `#131b2e` →
  `#1e293b` → `#334155`, texto secundário `#94a3b8`, texto principal
  `#f1f5f9`). Cor de destaque/ação em **âmbar** (`#f59e0b`, hover
  `#b45309`) — representa os gates de decisão. Verde (`#22c55e`) para
  aprovação/sucesso. Vermelho (`#ef4444`) para rejeição/erro. Evite azul
  genérico de SaaS — a identidade do produto gira em torno de slate + âmbar.
- **Tipografia**: **Sora** (peso 600–800) para títulos e display; **Inter**
  (peso 400–600) para corpo de texto, labels e dados tabulares.
- **Tom visual**: modo escuro como padrão, cantos arredondados médios
  (8–16px), cards com borda sutil (1px, baixo contraste) em vez de sombras
  pesadas, bastante respiro entre seções. Ícones lineares, finos.
- Evite qualquer aparência de template genérico de admin dashboard — quero
  que o "gate" (âmbar) seja um elemento visual recorrente e reconhecível em
  toda a interface, não só um detalhe de botão.

## Telas a gerar (nesta ordem de prioridade)

### 1. Login e Cadastro
Tela de autenticação simples, centralizada, com o logo/nome "IMS" em
destaque. Cadastro pede nome, e-mail, senha e departamento (dropdown).

### 2. Submissão de Nova Ideia (perfil Colaborador)
Formulário estruturado que **minimiza o atrito de preenchimento**,
priorizando campos de texto livre nas etapas iniciais. Campos: título,
descrição do problema identificado, descrição da solução proposta, área/
departamento de origem, impacto estimado (qualitativo), recursos
necessários, e upload de anexos (imagens, documentos, protótipos visuais).
Deve comunicar claramente em qual estágio do funil a ideia entrará
(Ideação) e validar campos obrigatórios com mensagens de erro específicas
por campo.

### 3. Painel do Funil — Kanban (perfis Administrador/Avaliador)
O núcleo visual do produto: um kanban com **6 colunas fixas**, uma por
estágio do funil, cada uma mostrando os cards de ideia correspondentes com
contagem no cabeçalho da coluna. Cada card mostra: título da ideia, autor,
departamento (como tag colorida) e um badge de status (Em andamento /
Aprovada / Rejeitada). Acima do kanban, uma barra de filtros por área,
período e status. O visual deve comunicar "funil" — friccione visualmente
a ideia de progressão da esquerda (Ideação) para a direita (Lançamento).

### 4. Detalhe da Ideia + Timeline de Progresso (todos os perfis, conteúdo varia por permissão)
Tela de detalhamento de uma ideia específica: descrição completa, anexos,
e uma **timeline vertical** com todo o histórico de movimentações entre
estágios — cada entrada mostra a data, o responsável pela decisão, a
decisão tomada (aprovar/revisar/rejeitar) e o feedback textual associado.
Se a ideia foi devolvida para ajustes, os pontos a revisar devem aparecer
em destaque. Para o Colaborador dono da ideia, incluir um botão de
destaque "Solicitar revisão do próximo gate".

### 5. Formulário de Avaliação de Gate (perfil Avaliador)
Fila de avaliações pendentes em lista (idea + gate + prazo). Ao abrir uma
avaliação: conteúdo completo da ideia e seu histórico ao lado, e um
formulário com um **slider ou campo de nota (0–10) para cada critério
ponderado** (mostrando o peso de cada critério), um campo de comentário
por critério, e um campo de justificativa geral obrigatório antes de
confirmar o envio.

### 6. Decisão Final de Gate (perfil Administrador)
Tela que aparece quando todos os avaliadores de um gate concluíram: mostra
a **pontuação consolidada** em destaque (número grande), a recomendação
automática do sistema (aprovar/revisar/rejeitar), e a lista de avaliações
individuais com nota e comentário de cada avaliador. Abaixo, 3 botões de
decisão (Aprovar / Revisar / Rejeitar) mutuamente exclusivos e um campo de
justificativa **obrigatório independentemente da decisão tomada** — o botão
de confirmar só habilita com justificativa preenchida.

### 7. Painel de Indicadores (KPIs) — perfil Administrador
Dashboard com: número de ideias submetidas por período (gráfico de linha
ou barras), taxa de conversão entre estágios do funil (funil visual ou
barras horizontais decrescentes), tempo médio de permanência por estágio,
distribuição de ideias por departamento (gráfico de pizza ou barras
empilhadas) e status geral dos projetos aprovados em desenvolvimento.

### 8. Mural de Ideias Aprovadas (perfil Colaborador)
Grid de cards das ideias já aprovadas na organização — visão pública
interna, mais leve e "vitrine", com autor, departamento e um resumo da
solução.

## Estados a cobrir em cada tela
Para cada tela, gere também: estado vazio (sem dados ainda), estado de
carregamento e estado de erro/validação — não apenas o "caminho feliz".

## O que NÃO preciso
Não inclua nada sobre infraestrutura, nuvem ou telas de configuração de
servidor — o produto roda localmente e isso não faz parte da experiência do
usuário final. Não crie uma tela de "configuração de critérios de gate" por
enquanto — os critérios já vêm pré-configurados pelo sistema.
