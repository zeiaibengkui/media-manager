-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "aiPrompt" TEXT NOT NULL,
    "concurrency" INTEGER NOT NULL,
    "nearThreshold" DOUBLE PRECISION NOT NULL,
    "skipAi" BOOLEAN NOT NULL,
    "skipExif" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);
