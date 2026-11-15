-- CreateTable
CREATE TABLE "MediaPath" (
    "id" TEXT NOT NULL,
    "mediaHash" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateDecision" (
    "leftHash" TEXT NOT NULL,
    "rightHash" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateDecision_pkey" PRIMARY KEY ("leftHash","rightHash")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaPath_filePath_key" ON "MediaPath"("filePath");

-- CreateIndex
CREATE INDEX "MediaPath_mediaHash_idx" ON "MediaPath"("mediaHash");

-- AddForeignKey
ALTER TABLE "MediaPath" ADD CONSTRAINT "MediaPath_mediaHash_fkey" FOREIGN KEY ("mediaHash") REFERENCES "Media"("fileHash") ON DELETE CASCADE ON UPDATE CASCADE;
