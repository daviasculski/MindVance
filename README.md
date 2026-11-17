# MindVance

Plataforma web corporativa para gestão da inovação — Trabalho de Conclusão de Curso em Sistemas de Informação, PUCRS. 
Desenvolvido por: Davi Iasculski e Otavio Quadros

## Visão geral

O **MindVance** apoia a gestão de ideias e projetos de inovação por meio de um processo estruturado de avaliação e decisão. O modelo combina a metodologia **Stage-Gate** (Cooper, 2008) com o **Funil de Inovação** (Clark & Wheelwright, 1993), organizando a jornada desde a submissão da ideia até seu lançamento.

A plataforma busca substituir planilhas dispersas e fluxos informais por um processo rastreável, com governança auditável, avaliações multicritério ponderadas e transparência para colaboradores sobre o andamento e as decisões de suas ideias.

O fluxo contempla seis estágios — **Ideação → Escopo → Plano de Negócios → Desenvolvimento → Teste e Validação → Lançamento** — separados por cinco gates. A configuração inicial dos gates e dos critérios é aplicada pelas migrations do banco.

### Módulos principais

- **Submissão de ideias:** formulário com dados principais e campos adicionais flexíveis armazenados como `JSONB`, além de anexos.
- **Pipeline visual:** acompanhamento do portfólio em formato Kanban, organizado pelos estágios do funil.
- **Governança Stage-Gate:** triagem, designação de avaliadores, avaliações com critérios ponderados, consolidação de recomendações e decisões justificadas.
- **Acesso por papéis (RBAC):** quatro perfis — Colaborador, Avaliador, Gestor de Inovação e Administrador.
- **Notificações internas:** lista de notificações e contador de não lidas, atualizados periodicamente no navegador (polling a cada 30 segundos) e quando a janela volta ao foco.
- **Dashboard de KPIs:** indicadores e visão do funil de inovação.
- **Rastreabilidade:** histórico de decisões, revisões e mudanças manuais de estágio.

## Arquitetura e stack tecnológica

O repositório está organizado em camadas no back-end: domínio, casos de uso, infraestrutura e apresentação. A API REST é construída com **Express** (não Fastify).

| Camada | Tecnologias |
|---|---|
| Back-end | Node.js, TypeScript, Express 4, Clean Architecture, Prisma ORM 6, PostgreSQL 16 (`JSONB`), JWT, Jest e Supertest |
| Front-end | React 19, TypeScript, Vite 8, Tailwind CSS 4, Recharts e Lucide React |
| Banco local | PostgreSQL 16, disponibilizado pelo Docker Compose |

### Estrutura resumida

```text
MindVance/
├── backend/
│   ├── prisma/             # Schema e migrations do banco
│   ├── src/
│   │   ├── application/    # Casos de uso
│   │   ├── domain/         # Entidades, regras e contratos
│   │   ├── infrastructure/ # Prisma, repositórios e e-mail
│   │   └── presentation/   # Rotas, controllers e middlewares
│   └── tests/              # Testes unitários, integração e segurança
├── frontend/
│   └── src/
│       ├── components/     # Componentes reutilizáveis
│       ├── lib/            # Integração com a API
│       └── screens/        # Telas da aplicação
├── docs/                   # Documentação funcional e diagramas BPMN
└── docker-compose.yml      # PostgreSQL para desenvolvimento local
```

## Pré-requisitos

- **Git**
- **Node.js 22.12 ou superior** e npm. O Vite 8 requer Node.js `^20.19.0` ou `>=22.12.0`; Node.js 22 é recomendado.
- **Docker Desktop** com Docker Compose, para subir o PostgreSQL localmente. Alternativamente, pode-se usar uma instalação PostgreSQL 16 acessível pela aplicação.

Confira as instalações:

```bash
node --version
npm --version
docker compose version
```

## Instalação e execução local

Os comandos abaixo presumem três terminais: um para o banco (opcional, pois ele roda em segundo plano), um para a API e outro para a interface.

### 1. Clone o repositório

```bash
git clone https://github.com/daviasculski/MindVance.git
cd MindVance
```

### 2. Configure e inicie o back-end

Na raiz do projeto, suba o PostgreSQL:

```bash
docker compose up -d
```

O serviço usa PostgreSQL 16, banco `mindvance`, usuário `postgres`, senha `postgres` e porta `5432`. Os dados persistem no volume `pgdata`. Se a porta local `5432` estiver ocupada, defina outra porta para o host, por exemplo `POSTGRES_PORT=5433`, e ajuste também a porta no `DATABASE_URL`.

Em PowerShell, na raiz do repositório:

```powershell
$env:POSTGRES_PORT = "5433"
docker compose up -d
```

Nesse caso, use `localhost:5433` no `DATABASE_URL` do `backend/.env`.

Entre na pasta do back-end e instale as dependências:

```bash
cd backend
npm ci
```

Copie `backend/.env.example` para `backend/.env` e ajuste os valores conforme seu ambiente. Em PowerShell, na pasta `backend/`:

```powershell
Copy-Item .env.example .env
```

O arquivo contém estas variáveis:

```env
PORT=3333
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mindvance?schema=public"
JWT_SECRET=troque_por_um_segredo_longo
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=seu_usuario_mailtrap
SMTP_PASS=sua_senha_mailtrap
SMTP_FROM="MindVance <no-reply@example.com>"
FRONTEND_URL=http://localhost:8443
UPLOAD_DIR=uploads
UPLOAD_MAX_MB=10
```

- Substitua `JWT_SECRET` por um segredo longo e aleatório; não use o valor de exemplo em ambientes compartilhados ou de produção.
- Configure as credenciais `SMTP_*` de um serviço SMTP de teste (por exemplo, Mailtrap) para habilitar o envio de e-mails.
- `FRONTEND_URL` é usado nos links de redefinição de senha. `UPLOAD_DIR` define a pasta de anexos (relativa a `backend/`) e `UPLOAD_MAX_MB` limita o tamanho individual do arquivo.
- Não versione o arquivo `.env` nem credenciais reais.

Aplique as migrations e gere o cliente Prisma:

```bash
npx prisma migrate deploy
npx prisma generate
```

Não há um comando separado de seed configurado no `package.json`: as migrations também inserem os cinco gates e seus critérios iniciais. Para iniciar a API:

```bash
npm run dev
```

A API ficará disponível em `http://localhost:3333`, com as rotas sob `/api`. O endpoint `http://localhost:3333/api/health/db` verifica a conexão com o banco.

### 3. Configure e inicie o front-end

Em outro terminal, a partir da raiz do repositório:

```bash
cd frontend
npm ci
```

O front-end usa a variável `VITE_API_URL`, cujo valor padrão no código é `http://localhost:3333/api`. Para customizar, copie `frontend/.env.example` para `frontend/.env`. No PowerShell, estando em `frontend/`:

```powershell
Copy-Item .env.example .env
```

O exemplo contém:

```env
VITE_API_URL=http://localhost:3333/api
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

A interface estará em **http://localhost:8443**. Essa é a porta padrão definida no Vite; o servidor usa `strictPort`, portanto não escolhe outra porta automaticamente. Para usar uma porta diferente, defina `PORT` antes de iniciar e atualize `FRONTEND_URL` no `.env` do back-end. Exemplo em PowerShell:

```powershell
$env:PORT = "5173"
npm run dev
```

## Testes automatizados e cobertura

Execute os testes na pasta `backend/`. A suíte usa configurações de teste próprias e não requer que o banco Docker esteja iniciado.

```bash
npm test
```

Para executar a suíte com relatório de cobertura:

```bash
npx jest --coverage
```

Também está disponível o script equivalente `npm run test:coverage`. No estado atual do projeto, a execução validada reportou **78 testes aprovados em 10 suítes**. A cobertura de instruções foi **97,63% no conjunto de arquivos críticos incluídos na configuração**: **97,04%** em `application/userstories` e **100%** em `presentation/middlewares`. O relatório HTML é gerado em `backend/coverage/`.

## Autores e contexto acadêmico

O **MindVance** é um Trabalho de Conclusão de Curso do **Bacharelado em Sistemas de Informação da Pontifícia Universidade Católica do Rio Grande do Sul (PUCRS)**, desenvolvido no contexto acadêmico de **2026**.
