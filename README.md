# MindVance
Sistema de gestão da inovação corporativa baseado na metodologia Stage-Gate. TCC — Sistemas de Informação, PUCRS.

Funcionalidades, situação da integração e cronograma: [docs/mindvance-funcionalidades-e-roadmap.md](docs/mindvance-funcionalidades-e-roadmap.md).

## Como rodar o projeto

O projeto tem três partes, e as três precisam estar no ar:

| Parte | O que é | Onde roda |
|---|---|---|
| **Banco** | PostgreSQL, rodando no Docker | porta `5432` |
| **Backend** | API em Node + Express + Prisma (`backend/`) | http://localhost:3333 |
| **Frontend** | Interface em React + Vite (`frontend/`) | http://localhost:8443 |

### 1. Instale (só na primeira vez)

- [Node.js 22](https://nodejs.org/) — confira com `node -v`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — deixe ele **aberto** sempre que for rodar o projeto
- [Git](https://git-scm.com/)

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
```

Crie as tabelas no banco (rode de novo sempre que alguém adicionar uma migration nova):

```bash
npx prisma migrate deploy
```

Suba a API:

```bash
npm run dev
```

Deve aparecer `Server is running on http://localhost:3333`. **Deixe esse terminal aberto.**

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

> **Porta 8443 ocupada?** Rode em outra porta. No PowerShell: `$env:PORT=5173; npm run dev`. No Git Bash, Mac ou Linux: `PORT=5173 npm run dev`.

### 5. Crie seu usuário

O banco começa vazio. Há quatro perfis:

| Perfil | O que acessa |
|---|---|
| **Colaborador** | Submeter ideias, acompanhar as suas ideias e o mural de aprovadas |
| **Avaliador** | Fila de avaliações, mais tudo o que o Colaborador acessa |
| **Gestor de Inovação** | Decisão de gate, painel do funil, indicadores e mural |
| **Administrador** | Aprovação de cadastros (backoffice) e mural |

**Colaborador:** na tela de login, clique em **Criar conta**. A conta já entra ativa.

**Avaliador e Gestor:** também se cadastram por **Criar conta**, mas a conta fica **aguardando aprovação** até um Administrador aprová-la em **Solicitações**.

**Administrador:** não pode ser criado pela tela. Para criar o primeiro, cadastre-se como Colaborador e promova a conta no banco (Prisma Studio ou SQL):

```sql
UPDATE "users" SET "role" = 'ADMIN' WHERE "email" = 'seu-email@exemplo.com';
```

Depois de entrar como Administrador, aprove as contas de Avaliador e Gestor em **Solicitações**.

### Como saber se está tudo funcionando

- **Backend e banco:** abra http://localhost:3333/api/health/db. Se aparecer `"status":"ok"`, os dois estão conectados.
- **Ver os dados do banco:** na pasta `backend/`, rode `npx prisma studio` e abra http://localhost:5555. Ali dá para ver as tabelas `User`, `Idea` e `Evaluation`.
- **Ver o front conversando com a API:** no navegador, aperte `F12` e abra a aba **Network** (filtro **Fetch/XHR**). Cada ação mostra a requisição, o status (`200`/`201` = sucesso, `400` = dados inválidos, `401` = não autenticado, `500` = erro no servidor) e a resposta.

### Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Tela mostra "Não foi possível conectar ao servidor" | Backend não está rodando | Rode `npm run dev` em `backend/` |
| Login retorna "Authentication is not configured" | Falta `JWT_SECRET` no `backend/.env` | Adicione a variável e reinicie o backend |
| Erro `Can't reach database server` | Banco desligado ou `DATABASE_URL` errado | Abra o Docker Desktop e rode `docker compose up -d` na raiz |
| Login responde "Sua conta aguarda aprovação" | Conta de Avaliador ou Gestor ainda não aprovada | Um Administrador aprova em **Solicitações** |
| Erro `The table ... does not exist` | Migrations não aplicadas | Rode `npx prisma migrate deploy` em `backend/` |
| Erro `Cannot find module ...` | Dependências não instaladas | Rode `npm install` na pasta que deu erro |
| `Port 8443 is already in use` | Outro programa usando a porta | Use outra porta (veja o passo 4) |
| Comando `npx prisma` pede para instalar o Prisma 7 | O `npm install` não foi rodado em `backend/` | Rode `npm install` antes (o projeto usa o Prisma 6) |

### Para desligar

Feche os terminais do backend e do frontend (`Ctrl + C`) e desligue o banco com `docker compose stop` na raiz. Os dados ficam salvos para a próxima vez. (`docker compose down -v` apaga o banco inteiro.)
