-- AlterEnum
ALTER TYPE "GateReviewStatus" ADD VALUE 'CANCELADA';

-- AlterTable
ALTER TABLE "ideas" ADD COLUMN     "cancellation_reason" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_by_id" VARCHAR(255);
