# idevance
Sistema de gestão da inovação corporativa baseado na metodologia Stage-Gate. TCC — Sistemas de Informação, PUCRS.

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
