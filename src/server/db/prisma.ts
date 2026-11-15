import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPgliteAdapter } from "prisma-pglite";
import type { PrismaPgliteAdapter } from "prisma-pglite";
import { PrismaClient } from "../../generated/prisma/client.js";
import { ensureMediaOrganizationSchema } from "./media-organization-schema.js";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgliteAdapter?: PrismaPgliteAdapter;
};

const defaultDataDir = fileURLToPath(new URL("../../../data", import.meta.url));
const dataDir = path.resolve(process.env.DATABASE_DIR ?? defaultDataDir);
const prismaConfigPath = fileURLToPath(new URL("../../../prisma.config.ts", import.meta.url));

let cachedPrisma = globalForPrisma.prisma;
let cachedAdapter = globalForPrisma.pgliteAdapter;
let initialization: Promise<PrismaClient> | undefined;

async function initialize(): Promise<PrismaClient> {
  if (cachedPrisma) {
    return cachedPrisma;
  }

  cachedAdapter ??= await createPgliteAdapter({
    directDatabaseDirPath: dataDir,
    prismaConfigPath,
  });
  cachedPrisma = new PrismaClient({
    adapter: cachedAdapter,
  });
  await cachedPrisma.$executeRawUnsafe(
    'ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "title" TEXT',
  );
  await cachedPrisma.$executeRawUnsafe(
    'ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "capturedAt" TIMESTAMP(3)',
  );
  await cachedPrisma.$executeRawUnsafe(
    'UPDATE "Media" SET "capturedAt" = COALESCE(' +
    'CASE WHEN ("exif"->>\'DateTimeOriginal\') ~ \'^[0-9]{4}-[0-9]{2}-[0-9]{2}T\' ' +
    'THEN ("exif"->>\'DateTimeOriginal\')::timestamp END, ' +
    'CASE WHEN ("exif"->>\'CreateDate\') ~ \'^[0-9]{4}-[0-9]{2}-[0-9]{2}T\' ' +
    'THEN ("exif"->>\'CreateDate\')::timestamp END, "createdAt")',
  );
  await cachedPrisma.$executeRawUnsafe(
    'ALTER TABLE "Media" ALTER COLUMN "capturedAt" SET DEFAULT CURRENT_TIMESTAMP',
  );
  await cachedPrisma.$executeRawUnsafe(
    'ALTER TABLE "Media" ALTER COLUMN "capturedAt" SET NOT NULL',
  );
  await cachedPrisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "AppSettings" (' +
    '"id" TEXT PRIMARY KEY, "aiPrompt" TEXT NOT NULL, "concurrency" INTEGER NOT NULL, ' +
    '"nearThreshold" DOUBLE PRECISION NOT NULL, "skipAi" BOOLEAN NOT NULL, ' +
    '"skipExif" BOOLEAN NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL)',
  );
  await cachedPrisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "MediaPath" (' +
    '"id" TEXT PRIMARY KEY, "mediaHash" TEXT NOT NULL, "filePath" TEXT NOT NULL UNIQUE, ' +
    '"fileName" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
    'FOREIGN KEY ("mediaHash") REFERENCES "Media"("fileHash") ON DELETE CASCADE ON UPDATE CASCADE)',
  );
  await cachedPrisma.$executeRawUnsafe(
    'INSERT INTO "MediaPath" ("id", "mediaHash", "filePath", "fileName", "createdAt") ' +
    'SELECT md5("fileHash"), "fileHash", "filePath", "fileName", "createdAt" FROM "Media" ' +
    'ON CONFLICT ("filePath") DO NOTHING',
  );
  await cachedPrisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "DuplicateDecision" (' +
    '"leftHash" TEXT NOT NULL, "rightHash" TEXT NOT NULL, "decision" TEXT NOT NULL, ' +
    '"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
    'PRIMARY KEY ("leftHash", "rightHash"))',
  );
  await cachedPrisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "ScanJobRecord" (' +
    '"id" TEXT PRIMARY KEY, "status" TEXT NOT NULL, "request" JSONB NOT NULL, ' +
    '"summary" JSONB, "events" JSONB NOT NULL, "error" TEXT, "retryOf" TEXT, ' +
    '"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
    '"updatedAt" TIMESTAMP(3) NOT NULL, "startedAt" TIMESTAMP(3), ' +
    '"finishedAt" TIMESTAMP(3))',
  );
  await ensureMediaOrganizationSchema(cachedPrisma);

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = cachedPrisma;
    globalForPrisma.pgliteAdapter = cachedAdapter;
  }

  return cachedPrisma;
}

export async function getPrisma(): Promise<PrismaClient> {
  initialization ??= initialize();
  return initialization;
}

export async function disconnectDb(): Promise<void> {
  if (!cachedPrisma && !cachedAdapter) {
    return;
  }

  await cachedPrisma?.$disconnect();
  await cachedAdapter?.pgliteClient.close();
  cachedPrisma = undefined;
  cachedAdapter = undefined;
  initialization = undefined;
  delete globalForPrisma.prisma;
  delete globalForPrisma.pgliteAdapter;
}
