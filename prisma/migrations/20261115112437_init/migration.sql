-- CreateTable
CREATE TABLE "Media" (
    "fileHash" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "dhash64" VARCHAR(16),
    "phash64" VARCHAR(16),
    "description" TEXT,
    "exif" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("fileHash")
);

-- CreateIndex
CREATE INDEX "Media_filePath_idx" ON "Media"("filePath");
