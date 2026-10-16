-- CreateEnum
CREATE TYPE "IdeaStage" AS ENUM (
    'IDEATION',
    'SCOPE',
    'BUSINESS_PLAN',
    'DEVELOPMENT',
    'TESTING',
    'LAUNCH'
);

-- AlterTable
ALTER TABLE "ideas"
ADD COLUMN "current_stage" "IdeaStage" NOT NULL DEFAULT 'IDEATION';
