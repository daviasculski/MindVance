-- AlterTable: estágio em que a avaliação foi feita e notas por critério
ALTER TABLE "evaluations" ADD COLUMN     "criteria" JSONB,
ADD COLUMN     "stage" "IdeaStage";

-- Avaliações já existentes não registraram o estágio: usa o estágio atual da ideia
-- como melhor aproximação disponível.
UPDATE "evaluations" AS e
SET "stage" = i."current_stage"
FROM "ideas" AS i
WHERE e."ideaId" = i."id";

ALTER TABLE "evaluations" ALTER COLUMN "stage" SET NOT NULL;
