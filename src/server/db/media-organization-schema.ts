import type { PrismaClient } from "../../generated/prisma/client.js";

export async function ensureMediaOrganizationSchema(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "category" TEXT',
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "favorite" BOOLEAN NOT NULL DEFAULT false',
  );
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "MediaTag" (' +
    '"id" TEXT PRIMARY KEY, "mediaHash" TEXT NOT NULL, "name" TEXT NOT NULL, ' +
    '"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
    'FOREIGN KEY ("mediaHash") REFERENCES "Media"("fileHash") ' +
    'ON DELETE CASCADE ON UPDATE CASCADE)',
  );
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "Album" (' +
    '"id" TEXT PRIMARY KEY, "name" TEXT NOT NULL UNIQUE, ' +
    '"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
    '"updatedAt" TIMESTAMP(3) NOT NULL)',
  );
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "AlbumMedia" (' +
    '"albumId" TEXT NOT NULL, "mediaHash" TEXT NOT NULL, ' +
    '"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
    'PRIMARY KEY ("albumId", "mediaHash"), ' +
    'FOREIGN KEY ("albumId") REFERENCES "Album"("id") ' +
    'ON DELETE CASCADE ON UPDATE CASCADE, ' +
    'FOREIGN KEY ("mediaHash") REFERENCES "Media"("fileHash") ' +
    'ON DELETE CASCADE ON UPDATE CASCADE)',
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "Media_favorite_idx" ON "Media"("favorite")',
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "Media_category_idx" ON "Media"("category")',
  );
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "MediaTag_mediaHash_name_key" ' +
    'ON "MediaTag"("mediaHash", "name")',
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "MediaTag_name_idx" ON "MediaTag"("name")',
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "AlbumMedia_mediaHash_idx" ON "AlbumMedia"("mediaHash")',
  );
}
