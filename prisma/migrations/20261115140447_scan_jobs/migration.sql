-- CreateTable
CREATE TABLE "ScanJobRecord" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "request" JSONB NOT NULL,
    "summary" JSONB,
    "events" JSONB NOT NULL,
    "error" TEXT,
    "retryOf" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ScanJobRecord_pkey" PRIMARY KEY ("id")
);
