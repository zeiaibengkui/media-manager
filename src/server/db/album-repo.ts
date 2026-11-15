import type { Prisma } from "../../generated/prisma/client.js";
import { getPrisma } from "./prisma.js";

const ALBUM_INCLUDE = {
  _count: { select: { media: true } },
  media: {
    take: 1,
    orderBy: { createdAt: "asc" },
    include: {
      media: { select: { fileHash: true, fileName: true } },
    },
  },
} satisfies Prisma.AlbumInclude;

export type AlbumWithCover = Prisma.AlbumGetPayload<{
  include: typeof ALBUM_INCLUDE;
}>;

export async function listAlbums(): Promise<AlbumWithCover[]> {
  const prisma = await getPrisma();
  return prisma.album.findMany({
    include: ALBUM_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });
}

export async function findAlbum(albumId: string): Promise<AlbumWithCover | null> {
  const prisma = await getPrisma();
  return prisma.album.findUnique({
    where: { id: albumId },
    include: ALBUM_INCLUDE,
  });
}

export async function createAlbum(name: string): Promise<AlbumWithCover> {
  const prisma = await getPrisma();
  return prisma.album.create({
    data: { name },
    include: ALBUM_INCLUDE,
  });
}

export async function deleteAlbum(albumId: string): Promise<void> {
  const prisma = await getPrisma();
  await prisma.album.delete({ where: { id: albumId } });
}

export async function addMediaToAlbum(
  albumId: string,
  mediaHash: string,
): Promise<void> {
  const prisma = await getPrisma();
  await prisma.$transaction([
    prisma.albumMedia.upsert({
      where: { albumId_mediaHash: { albumId, mediaHash } },
      create: { albumId, mediaHash },
      update: {},
    }),
    prisma.album.update({
      where: { id: albumId },
      data: { updatedAt: new Date() },
    }),
  ]);
}

export async function removeMediaFromAlbum(
  albumId: string,
  mediaHash: string,
): Promise<void> {
  const prisma = await getPrisma();
  await prisma.$transaction([
    prisma.albumMedia.deleteMany({ where: { albumId, mediaHash } }),
    prisma.album.update({
      where: { id: albumId },
      data: { updatedAt: new Date() },
    }),
  ]);
}
