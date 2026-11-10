CREATE TABLE "manual_stage_transitions" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "fromStage" "IdeaStage" NOT NULL,
    "toStage" "IdeaStage" NOT NULL,
    "reason" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manual_stage_transitions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "manual_stage_transitions_ideaId_createdAt_idx"
ON "manual_stage_transitions"("ideaId", "createdAt");

ALTER TABLE "manual_stage_transitions"
ADD CONSTRAINT "manual_stage_transitions_ideaId_fkey"
FOREIGN KEY ("ideaId") REFERENCES "ideas"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "manual_stage_transitions"
ADD CONSTRAINT "manual_stage_transitions_changedById_fkey"
FOREIGN KEY ("changedById") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
