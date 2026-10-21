-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('EM_ANDAMENTO', 'EM_REVISAO', 'APROVADA', 'REJEITADA');

-- CreateEnum
CREATE TYPE "GateDecisionType" AS ENUM ('APROVADA', 'REJEITADA', 'REVISAO');

-- AlterTable
ALTER TABLE "ideas" ADD COLUMN     "status" "IdeaStatus" NOT NULL DEFAULT 'EM_ANDAMENTO';

-- CreateTable
CREATE TABLE "gate_decisions" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "stage" "IdeaStage" NOT NULL,
    "decision" "GateDecisionType" NOT NULL,
    "feedback" TEXT NOT NULL,
    "reviewPoints" JSONB,
    "deciderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gate_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gate_decisions_ideaId_idx" ON "gate_decisions"("ideaId");

-- AddForeignKey
ALTER TABLE "gate_decisions" ADD CONSTRAINT "gate_decisions_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
