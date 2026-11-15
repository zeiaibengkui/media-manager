import type { Prisma } from "../../generated/prisma/client.js";
import type { MediaCursor } from "../media-cursor.js";
import { getPrisma } from "./prisma.js";
import { MEDIA_INCLUDE } from "./media-repo.js";
import type { MediaWithPaths } from "./media-repo.js";

export interface MediaFilters {
  favoriteOnly?: boolean;
  albumId?: string;
}

function whereFor(
  cursor: MediaCursor | undefined,
  filters: MediaFilters,
): Prisma.MediaWhereInput | undefined {
  const conditions: Prisma.MediaWhereInput[] = [];
  if (cursor) {
    conditions.push({
      OR: [
        { capturedAt: { lt: new Date(cursor.capturedAt) } },
        {
          capturedAt: new Date(cursor.capturedAt),
          fileHash: { lt: cursor.fileHash },
        },
      ],
    });
  }
  if (filters.favoriteOnly) conditions.push({ favorite: true });
  if (filters.albumId) {
    conditions.push({ albums: { some: { albumId: filters.albumId } } });
  }
  return conditions.length ? { AND: conditions } : undefined;
}

export async function listMedia(
  limit: number,
  cursor?: MediaCursor,
  filters: MediaFilters = {},
): Promise<MediaWithPaths[]> {
  const prisma = await getPrisma();
  const where = whereFor(cursor, filters);
  return prisma.media.findMany({
    take: limit,
    include: MEDIA_INCLUDE,
    orderBy: [{ capturedAt: "desc" }, { fileHash: "desc" }],
    ...(where ? { where } : {}),
  });
}
