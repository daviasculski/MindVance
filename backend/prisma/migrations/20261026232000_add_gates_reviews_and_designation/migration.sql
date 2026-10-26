-- CreateEnum
CREATE TYPE "GateReviewStatus" AS ENUM ('AGUARDANDO_DESIGNACAO', 'EM_AVALIACAO', 'AGUARDANDO_DECISAO', 'DECIDIDA');

-- DropForeignKey
ALTER TABLE "gate_decisions" DROP CONSTRAINT "gate_decisions_ideaId_fkey";

-- AlterTable
ALTER TABLE "evaluations" ADD COLUMN     "reviewId" TEXT;

-- AlterTable
ALTER TABLE "gate_decisions" ADD COLUMN     "consolidatedScore" DOUBLE PRECISION,
ADD COLUMN     "recommendation" "GateDecisionType",
ADD COLUMN     "reviewId" TEXT,
ADD COLUMN     "toStage" "IdeaStage";

-- CreateTable
CREATE TABLE "gates" (
    "id" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "fromStage" "IdeaStage" NOT NULL,
    "toStage" "IdeaStage" NOT NULL,
    "deliverable" TEXT NOT NULL,
    "deadlineDays" INTEGER NOT NULL,
    "approveThreshold" DOUBLE PRECISION NOT NULL,
    "reviseThreshold" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "gates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_criteria" (
    "id" TEXT NOT NULL,
    "gateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "gate_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_reviews" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "gateId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "status" "GateReviewStatus" NOT NULL DEFAULT 'AGUARDANDO_DESIGNACAO',
    "requestedById" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3),
    "consolidatedScore" DOUBLE PRECISION,
    "recommendation" "GateDecisionType",

    CONSTRAINT "gate_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_review_evaluators" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gate_review_evaluators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gates_orderIndex_key" ON "gates"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "gates_fromStage_key" ON "gates"("fromStage");

-- CreateIndex
CREATE UNIQUE INDEX "gate_criteria_gateId_orderIndex_key" ON "gate_criteria"("gateId", "orderIndex");

-- CreateIndex
CREATE INDEX "gate_reviews_status_idx" ON "gate_reviews"("status");

-- CreateIndex
CREATE UNIQUE INDEX "gate_reviews_ideaId_gateId_round_key" ON "gate_reviews"("ideaId", "gateId", "round");

-- CreateIndex
CREATE INDEX "gate_review_evaluators_evaluatorId_idx" ON "gate_review_evaluators"("evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "gate_review_evaluators_reviewId_evaluatorId_key" ON "gate_review_evaluators"("reviewId", "evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_reviewId_evaluatorId_key" ON "evaluations"("reviewId", "evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "gate_decisions_reviewId_key" ON "gate_decisions"("reviewId");

-- AddForeignKey
ALTER TABLE "gate_criteria" ADD CONSTRAINT "gate_criteria_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "gates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_reviews" ADD CONSTRAINT "gate_reviews_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_reviews" ADD CONSTRAINT "gate_reviews_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "gates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_review_evaluators" ADD CONSTRAINT "gate_review_evaluators_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "gate_reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_decisions" ADD CONSTRAINT "gate_decisions_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_decisions" ADD CONSTRAINT "gate_decisions_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "gate_reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "gate_reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Configuração do sistema: os 5 gates do Stage-Gate (G1 a G5) e seus critérios.
-- O Lançamento não tem gate de saída: é o estágio final. Limites inclusivos: score >= 7,0 aprova; >= 4,0 revisa.
INSERT INTO "gates" ("id", "orderIndex", "name", "fromStage", "toStage", "deliverable", "deadlineDays", "approveThreshold", "reviseThreshold") VALUES
  (gen_random_uuid()::text, 1, 'Gate 1', 'IDEACAO', 'ESCOPO', 'Ideia submetida', 7, 7.0, 4.0),
  (gen_random_uuid()::text, 2, 'Gate 2', 'ESCOPO', 'PLANO_DE_NEGOCIOS', 'Esboço de plano de negócios', 7, 7.0, 4.0),
  (gen_random_uuid()::text, 3, 'Gate 3', 'PLANO_DE_NEGOCIOS', 'DESENVOLVIMENTO', 'Especificações técnicas de desenvolvimento', 7, 7.0, 4.0),
  (gen_random_uuid()::text, 4, 'Gate 4', 'DESENVOLVIMENTO', 'TESTE_E_VALIDACAO', 'Resultados de testes e validação', 7, 7.0, 4.0),
  (gen_random_uuid()::text, 5, 'Gate 5', 'TESTE_E_VALIDACAO', 'LANCAMENTO', 'Plano de lançamento', 7, 7.0, 4.0);

INSERT INTO "gate_criteria" ("id", "gateId", "name", "description", "weight", "orderIndex")
SELECT gen_random_uuid()::text, g."id", c."name", c."description", c."weight", c."orderIndex"
FROM "gates" g
CROSS JOIN (VALUES
  ('Alinhamento Estratégico', 'Quanto a ideia contribui para os objetivos estratégicos da empresa.', 30, 1),
  ('Viabilidade Técnica', 'Capacidade de executar a ideia com a tecnologia e as competências disponíveis.', 25, 2),
  ('Potencial de Mercado', 'Tamanho do impacto esperado para clientes, usuários ou operação.', 25, 3),
  ('Risco de Execução', 'Nota inversa ao risco: quanto menor o risco de execução, maior a nota.', 20, 4)
) AS c("name", "description", "weight", "orderIndex");

-- Ideias existentes: as que estão em Ideação aguardam a triagem do Gestor;
-- as que chegaram ao Lançamento já passaram pelo G5 e estão aprovadas para lançamento.
UPDATE "ideas" SET "status" = 'AGUARDANDO_TRIAGEM' WHERE "current_stage" = 'IDEACAO' AND "status" = 'EM_ANDAMENTO';
UPDATE "ideas" SET "status" = 'APROVADA' WHERE "current_stage" = 'LANCAMENTO' AND "status" = 'EM_ANDAMENTO';
