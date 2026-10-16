/*
  Warnings:

  - The values [IDEATION,SCOPE,BUSINESS_PLAN,DEVELOPMENT,TESTING,LAUNCH] on the enum `IdeaStage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "IdeaStage_new" AS ENUM ('IDEACAO', 'ESCOPO', 'PLANO_DE_NEGOCIOS', 'DESENVOLVIMENTO', 'TESTE_E_VALIDACAO', 'LANCAMENTO');
ALTER TABLE "public"."ideas" ALTER COLUMN "current_stage" DROP DEFAULT;
ALTER TABLE "ideas" ALTER COLUMN "current_stage" TYPE "IdeaStage_new" USING ("current_stage"::text::"IdeaStage_new");
ALTER TYPE "IdeaStage" RENAME TO "IdeaStage_old";
ALTER TYPE "IdeaStage_new" RENAME TO "IdeaStage";
DROP TYPE "public"."IdeaStage_old";
ALTER TABLE "ideas" ALTER COLUMN "current_stage" SET DEFAULT 'IDEACAO';
COMMIT;

-- AlterTable
ALTER TABLE "ideas" ALTER COLUMN "current_stage" SET DEFAULT 'IDEACAO';
