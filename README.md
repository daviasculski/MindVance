# idevance
Sistema de gestão da inovação corporativa baseado na metodologia Stage-Gate. TCC — Sistemas de Informação, PUCRS.

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

Com o Docker Desktop aberto, rode **uma vez** para criar o banco:

```bash
docker run -d --name mindvance-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=idevance -p 5432:5432 -v mindvance-pgdata:/var/lib/postgresql/data postgres:16
```

Nas próximas vezes, o banco já existe. Basta ligá-lo:

```bash
docker start mindvance-postgres
```

> **Porta 5432 ocupada?** Se você já tem outro Postgres na máquina, troque `-p 5432:5432` por `-p 5433:5432` e use `5433` no `DATABASE_URL` do passo 3.

### 3. Configure e rode o backend

Abra um terminal na pasta `backend/`:

```bash
cd backend
npm install
```

Crie o arquivo `backend/.env` copiando o `backend/.env.example` e preencha assim:

```env
PORT=3333
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/idevance?schema=public"
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

O banco começa vazio. Na tela de login, clique em **Criar conta** e escolha o perfil:

| Perfil | O que acessa |
|---|---|
| **Colaborador** | Submeter ideias, ver as suas ideias e o mural de aprovadas |
| **Avaliador** | Fila de avaliações e painel do funil |
| **Administrador** | Painel do funil, decisões de gate e indicadores |

Para testar os três fluxos, crie uma conta de cada perfil.

### Como saber se está tudo funcionando

- **Backend e banco:** abra http://localhost:3333/api/health/db. Se aparecer `"status":"ok"`, os dois estão conectados.
- **Ver os dados do banco:** na pasta `backend/`, rode `npx prisma studio` e abra http://localhost:5555. Ali dá para ver as tabelas `User`, `Idea` e `Evaluation`.
- **Ver o front conversando com a API:** no navegador, aperte `F12` e abra a aba **Network** (filtro **Fetch/XHR**). Cada ação mostra a requisição, o status (`200`/`201` = sucesso, `400` = dados inválidos, `401` = não autenticado, `500` = erro no servidor) e a resposta.

### Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Tela mostra "Não foi possível conectar ao servidor" | Backend não está rodando | Rode `npm run dev` em `backend/` |
| Login retorna "Authentication is not configured" | Falta `JWT_SECRET` no `backend/.env` | Adicione a variável e reinicie o backend |
| Erro `Can't reach database server` | Banco desligado ou `DATABASE_URL` errado | Abra o Docker Desktop e rode `docker start mindvance-postgres` |
| Erro `The table ... does not exist` | Migrations não aplicadas | Rode `npx prisma migrate deploy` em `backend/` |
| Erro `Cannot find module ...` | Dependências não instaladas | Rode `npm install` na pasta que deu erro |
| `Port 8443 is already in use` | Outro programa usando a porta | Use outra porta (veja o passo 4) |
| Comando `npx prisma` pede para instalar o Prisma 7 | O `npm install` não foi rodado em `backend/` | Rode `npm install` antes (o projeto usa o Prisma 6) |

### Para desligar

Feche os terminais do backend e do frontend (`Ctrl + C`) e desligue o banco com `docker stop mindvance-postgres`. Os dados ficam salvos para a próxima vez.

## Indicadores de inovação

O endpoint `GET /api/ideas/metrics` retorna o total de ideias, a distribuição por estágio e a distribuição por área ou departamento. O acesso exige autenticação e o perfil `MANAGEMENT`.

Após aplicar as migrations do Prisma na pasta `backend`, as contas existentes e novas recebem o perfil `USER` por padrão. Para conceder acesso de gestão, altere o perfil da conta por um processo administrativo confiável, por exemplo:

```sql
UPDATE "users"
SET "role" = 'MANAGEMENT'
WHERE "email" = 'gestor@example.com';
```

O endpoint `POST /api/evaluations` exige autenticação e somente aceita usuários com o perfil `EVALUATOR`. A UserStory rejeita os demais perfis e impede que o autor avalie a própria ideia. Para atribuir o perfil de avaliador por um processo administrativo confiável:

```sql
UPDATE "users"
SET "role" = 'EVALUATOR'
WHERE "email" = 'avaliador@example.com';
```

O usuário deve autenticar-se novamente para obter um token com o perfil atualizado.
