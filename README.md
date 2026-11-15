# MindVance

Sistema de gestão da inovação corporativa baseado na metodologia **Stage-Gate**. TCC — Sistemas de Informação, PUCRS.

## O que é

O MindVance leva uma ideia da submissão até o lançamento, passando por **seis estágios** separados por **cinco gates** de avaliação:

**Ideação → Escopo → Plano de Negócios → Desenvolvimento → Teste e Validação → Lançamento**

1. O **Colaborador** submete a ideia (problema, solução, área, impacto, recursos e anexos).
2. O **Gestor de Inovação** faz a triagem, abre o gate e designa os **Avaliadores**.
3. Cada Avaliador dá nota de 0 a 10 em quatro critérios ponderados (Alinhamento estratégico 30%, Viabilidade técnica 25%, Potencial de mercado 25%, Risco de execução 20%) e escreve uma justificativa.
4. O sistema consolida o score e **recomenda**: ≥ 7,0 aprovar · ≥ 4,0 revisar · < 4,0 rejeitar.
5. O Gestor **decide** (pode divergir da recomendação), sempre com justificativa:
   - **Aprovar:** a ideia avança de estágio; no último gate, chega ao Lançamento e entra no Mural de aprovadas.
   - **Revisar:** volta ao autor para ajustes e abre uma nova rodada no mesmo gate.
   - **Rejeitar:** a ideia é arquivada.

Além do fluxo principal:
- **Prazos:** o sistema alerta quando um avaliador perde o prazo do gate.
- **Notificações:** toda etapa notifica os envolvidos dentro do sistema e por e-mail.
- **Cancelamento:** autor, Gestor ou Admin podem cancelar uma ideia ativa, com justificativa.
- **Avanço manual:** Gestor e Admin podem avançar uma ideia de estágio, com justificativa auditada.
- **Painéis:** o funil e os indicadores (KPIs) acompanham o portfólio.
- **Histórico:** fica registrado de forma imutável.

**Tecnologias:** React 19 + Vite + Tailwind (frontend) · Node 22 + Express + TypeScript + Prisma 6 (backend) · PostgreSQL 16 no Docker · JWT com controle de acesso por papel · e-mails via SMTP (Mailtrap em desenvolvimento) · testes com Jest.

### Estrutura do repositório

| Pasta | Conteúdo |
|---|---|
| `backend/` | API REST em camadas: `domain` (entidades e contratos), `application` (casos de uso), `infrastructure` (Prisma, e-mail), `presentation` (rotas, controllers, middlewares, rotina de prazos) |
| `backend/prisma/` | Schema, migrations e o diagrama do banco gerado automaticamente (`diagrama-banco.svg`) |
| `backend/tests/` | Testes unitários, de integração e de segurança |
| `frontend/` | Interface (`src/screens` = telas, `src/components`, `src/lib` = acesso à API) |
| `docs/` | Funcionalidades, decisões e situação da integração: [mindvance-funcionalidades-e-roadmap.md](docs/mindvance-funcionalidades-e-roadmap.md) |

## Como rodar o projeto

O projeto tem três partes, e as três precisam estar no ar:

| Parte | O que é | Onde roda |
|---|---|---|
| **Banco** | PostgreSQL, rodando no Docker | porta `5432` |
| **Backend** | API em Node + Express + Prisma (`backend/`) | http://localhost:3333 |
| **Frontend** | Interface em React + Vite (`frontend/`) | http://localhost:8443 |

### 1. Instale (só na primeira vez)

- [Node.js 22](https://nodejs.org/): confira com `node -v`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/): deixe ele **aberto** sempre que for rodar o projeto
- [Git](https://git-scm.com/)

Clone o repositório e entre na branch de integração:

```bash
git clone https://github.com/daviasculski/MindVance.git
cd MindVance
git checkout dev
```

### 2. Suba o banco de dados

Com o Docker Desktop aberto, rode na **raiz do repositório**:

```bash
docker compose up -d
```

Isso cria (na primeira vez) e liga o PostgreSQL com o banco `mindvance`, usuário `postgres` e senha `postgres`. Nas próximas vezes, o mesmo comando apenas liga o banco.

> **Porta 5432 ocupada?** Se você já tem outro Postgres na máquina, suba em outra porta e use essa porta no `DATABASE_URL` do passo 3. No PowerShell: `$env:POSTGRES_PORT=5433; docker compose up -d`. No Git Bash, Mac ou Linux: `POSTGRES_PORT=5433 docker compose up -d`.
>
> **Já tinha criado o banco com `docker run`** (versões antigas deste README)? Ele continua funcionando com o seu `.env` atual; não é preciso migrar.

### 3. Configure e rode o backend

Abra um terminal na pasta `backend/`:

```bash
cd backend
npm install
```

Crie o arquivo `backend/.env` copiando o `backend/.env.example` e preencha assim:

```env
PORT=3333
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mindvance?schema=public"
JWT_SECRET=coloque_aqui_um_texto_longo_e_aleatorio
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=seu_usuario_mailtrap
SMTP_PASS=sua_senha_mailtrap
SMTP_FROM="MindVance <no-reply@example.com>"
FRONTEND_URL=http://localhost:8443
UPLOAD_DIR=uploads
UPLOAD_MAX_MB=10
```

- **`SMTP_*`:** credenciais de uma caixa de testes do [Mailtrap](https://mailtrap.io/). `SMTP_FROM` é um remetente permitido pelo provedor (em produção, use um endereço do seu domínio). Os e-mails são enviados em segundo plano; se o SMTP falhar, a ação continua funcionando e a falha aparece no log da API.
- **`FRONTEND_URL`:** endereço do frontend, usado no link de redefinição de senha.
- **`UPLOAD_DIR` e `UPLOAD_MAX_MB`:** pasta onde os anexos ficam salvos (relativa a `backend/`, fora do Git) e limite por arquivo, em MB.

Crie as tabelas no banco e gere o cliente do Prisma:

```bash
npx prisma migrate deploy
npx prisma generate
```

O `generate` também atualiza o diagrama do banco em `backend/prisma/diagrama-banco.svg`.

Suba a API:

```bash
npm run dev
```

Deve aparecer `Servidor rodando na URL http://localhost:3333`. **Deixe esse terminal aberto.**

### 4. Configure e rode o frontend

Abra **outro** terminal na pasta `frontend/`:

```bash
cd frontend
npm install
```

Crie o arquivo `frontend/.env` copiando o `frontend/.env.example` (o valor padrão já funciona):

```env
VITE_API_URL=http://localhost:3333/api
```

Suba a interface:

```bash
npm run dev
```

Acesse **http://localhost:8443**.

> **Porta 8443 ocupada?** Rode em outra porta. No PowerShell: `$env:PORT=5173; npm run dev`. No Git Bash, Mac ou Linux: `PORT=5173 npm run dev`. Se mudar a porta, ajuste também o `FRONTEND_URL` do backend.

### 5. Crie seu usuário

O banco começa vazio. Há quatro perfis:

| Perfil | O que acessa |
|---|---|
| **Colaborador** | Nova ideia (com anexos), Minhas ideias (editar, anexar entregas, solicitar revisão do gate, cancelar) e Mural de aprovadas |
| **Avaliador** | Fila de avaliações, mais tudo o que o Colaborador acessa |
| **Gestor de Inovação** | Triagem e designação, Decisão de gate, Painel do funil (com avanço manual de estágio), Indicadores e Mural |
| **Administrador** | Usuários (troca de papel), Solicitações (aprovar cadastros), Painel do funil (com avanço manual), Indicadores (somente leitura) e Mural |

**Colaborador:** na tela de login, clique em **Criar conta** e escolha o departamento. A conta já entra ativa.

**Avaliador e Gestor:** também se cadastram por **Criar conta**, mas a conta fica **aguardando aprovação** e não faz login até um Administrador aprová-la em **Solicitações**. O resultado chega por e-mail.

**Administrador:** não pode ser criado pela tela. Para criar o primeiro, cadastre-se como Colaborador e promova a conta no banco (Prisma Studio ou SQL):

```sql
UPDATE "users" SET "role" = 'ADMIN' WHERE "email" = 'seu-email@exemplo.com';
```

Depois de entrar como Administrador, aprove as contas de Avaliador e Gestor em **Solicitações**.

### Atualizando depois de um `git pull`

Quando chegarem mudanças de outras pessoas:

1. Pare o backend (`Ctrl + C`).
2. Atualize as dependências e o banco:

   ```bash
   cd backend
   npm install
   npx prisma migrate deploy
   npx prisma generate
   npm run dev
   ```

3. Atualize o frontend: `cd frontend && npm install` e depois `npm run dev`.

> No Windows, o `prisma generate` falha com `EPERM ... query_engine-windows.dll.node` se o backend estiver rodando. Pare o backend antes de gerar.

### Testes automatizados

Na pasta `backend/`:

```bash
npm test                # roda todos os testes (unitários, integração e segurança)
npm run test:coverage   # idem, com relatório de cobertura em backend/coverage/
```

Os testes usam um banco simulado: não precisam do Docker nem do `.env`.

### Como saber se está tudo funcionando

- **Backend e banco:** abra http://localhost:3333/api/health/db. Se aparecer `"status":"ok"`, os dois estão conectados.
- **Ver os dados do banco:** na pasta `backend/`, rode `npx prisma studio` e abra http://localhost:5555. Para ver como as tabelas se relacionam, abra `backend/prisma/diagrama-banco.svg`.
- **Ver o front conversando com a API:** no navegador, aperte `F12` e abra a aba **Network** (filtro **Fetch/XHR**). Cada ação mostra:
  - a requisição;
  - o status: `200`/`201` = sucesso, `400` = dados inválidos, `401` = não autenticado, `403` = sem permissão, `409` = ação não permitida no estado atual, `500` = erro no servidor;
  - a resposta.
- **E-mails:** aparecem na caixa de testes do Mailtrap.

### Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Tela mostra "Não foi possível conectar ao servidor" | Backend não está rodando | Rode `npm run dev` em `backend/` |
| Login retorna "Authentication is not configured" | Falta `JWT_SECRET` no `backend/.env` | Adicione a variável e reinicie o backend |
| Erro `Can't reach database server` | Banco desligado ou `DATABASE_URL` errado | Abra o Docker Desktop e rode `docker compose up -d` na raiz |
| Docker Desktop diz "unable to start" | Docker travado | Feche o Docker Desktop pela bandeja do sistema, abra de novo e espere ficar verde |
| Login diz que a conta aguarda aprovação ou foi recusada | Conta de Avaliador ou Gestor ainda não aprovada | Um Administrador aprova em **Solicitações** |
| Erro `The table ... does not exist` ou coluna inexistente | Migrations não aplicadas | Rode `npx prisma migrate deploy` em `backend/` |
| `EPERM: operation not permitted` no `prisma generate` | Backend rodando trava o arquivo do Prisma (Windows) | Pare o backend, rode `npx prisma generate` e suba de novo |
| Erro `Cannot find module ...` | Dependências não instaladas | Rode `npm install` na pasta que deu erro |
| Anexo recusado | Tipo não permitido ou acima de `UPLOAD_MAX_MB` | Use imagens, PDF, Office, texto ou `.zip`, até 5 arquivos por envio |
| E-mails não chegam | `SMTP_*` vazios ou errados | Confira as credenciais do Mailtrap; o erro aparece no terminal do backend |
| `Port 8443 is already in use` | Outro programa usando a porta | Use outra porta (veja o passo 4) |
| Comando `npx prisma` pede para instalar o Prisma 7 | O `npm install` não foi rodado em `backend/` | Rode `npm install` antes (o projeto usa o Prisma 6) |

### Para desligar

Feche os terminais do backend e do frontend (`Ctrl + C`) e desligue o banco com `docker compose stop` na raiz. Os dados ficam salvos para a próxima vez. (`docker compose down -v` apaga o banco inteiro.)
