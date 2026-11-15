import type {
  ScanEvent,
  ScanJob,
  ScanJobStatus,
  ScanRequest,
  ScanSummary,
} from "../../shared/api-types.js";
import { Prisma } from "../../generated/prisma/client.js";
import type { ScanJobRecord } from "../../generated/prisma/client.js";
import { getPrisma } from "./prisma.js";

function fromRecord(row: ScanJobRecord): ScanJob {
  return {
    id: row.id,
    status: row.status as ScanJobStatus,
    request: row.request as unknown as ScanRequest,
    summary: row.summary as unknown as ScanSummary | null,
    events: row.events as unknown as ScanEvent[],
    error: row.error,
    retryOf: row.retryOf,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toData(job: ScanJob): Prisma.ScanJobRecordUncheckedCreateInput {
  return {
    id: job.id,
    status: job.status,
    request: job.request as unknown as Prisma.InputJsonValue,
    summary: job.summary === null ? Prisma.JsonNull : job.summary as unknown as Prisma.InputJsonValue,
    events: job.events as unknown as Prisma.InputJsonValue,
    error: job.error,
    retryOf: job.retryOf,
    createdAt: new Date(job.createdAt),
    updatedAt: new Date(job.updatedAt),
  };
}

export async function createScanJob(job: ScanJob): Promise<void> {
  const prisma = await getPrisma();
  await prisma.scanJobRecord.create({ data: toData(job) });
}

export async function updateScanJob(job: ScanJob): Promise<void> {
  const prisma = await getPrisma();
  await prisma.scanJobRecord.update({
    where: { id: job.id },
    data: {
      status: job.status,
      summary: job.summary === null ? Prisma.JsonNull : job.summary as unknown as Prisma.InputJsonValue,
      events: job.events as unknown as Prisma.InputJsonValue,
      error: job.error,
      updatedAt: new Date(job.updatedAt),
      ...(job.status === "running" ? { startedAt: new Date(job.updatedAt) } : {}),
      ...(["completed", "failed", "stopped"].includes(job.status)
        ? { finishedAt: new Date(job.updatedAt) }
        : {}),
    },
  });
}

export async function findScanJob(id: string): Promise<ScanJob | null> {
  const prisma = await getPrisma();
  const row = await prisma.scanJobRecord.findUnique({ where: { id } });
  return row ? fromRecord(row) : null;
}

export async function listScanJobs(): Promise<ScanJob[]> {
  const prisma = await getPrisma();
  const rows = await prisma.scanJobRecord.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(fromRecord);
}

export async function markInterruptedJobs(): Promise<void> {
  const prisma = await getPrisma();
  await prisma.scanJobRecord.updateMany({
    where: { status: { in: ["queued", "running"] } },
    data: {
      status: "failed",
      error: "Server restarted before the job completed",
      finishedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}
