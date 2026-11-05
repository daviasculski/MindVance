-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "uploadedById" VARCHAR(255) NOT NULL,
    "stage" "IdeaStage" NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "storedName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(255) NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attachments_storedName_key" ON "attachments"("storedName");

-- CreateIndex
CREATE INDEX "attachments_ideaId_idx" ON "attachments"("ideaId");

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

