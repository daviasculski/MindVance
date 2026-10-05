-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "justification" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evaluations_ideaId_idx" ON "evaluations"("ideaId");

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
