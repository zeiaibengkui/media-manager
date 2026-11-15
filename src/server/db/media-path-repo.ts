import { getPrisma } from "./prisma.js";
import { MEDIA_INCLUDE } from "./media-repo.js";
import type { MediaWithPaths } from "./media-repo.js";

export async function addMediaPath(
  fileHash: string,
  filePath: string,
  fileName: string,
): Promise<void> {
  const prisma = await getPrisma();
  await prisma.mediaPath.upsert({
    where: { filePath },
    create: { mediaHash: fileHash, filePath, fileName },
    update: { mediaHash: fileHash, fileName },
  });
}

export async function updateMediaPathLocation(
  fileHash: string,
  oldFilePath: string,
  newFilePath: string,
  newFileName: string,
): Promise<MediaWithPaths> {
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const media = await tx.media.findUnique({
      where: { fileHash },
      include: MEDIA_INCLUDE,
    });
    if (!media) {
      throw new Error("Media record not found");
    }

    const oldPath = media.paths.find((item) => item.filePath === oldFilePath);
    if (oldPath) {
      await tx.mediaPath.update({
        where: { id: oldPath.id },
        data: { filePath: newFilePath, fileName: newFileName },
      });
    }
    const primary = media.filePath === oldFilePath;
    return tx.media.update({
      where: { fileHash },
      data: primary ? { filePath: newFilePath, fileName: newFileName } : {},
      include: MEDIA_INCLUDE,
    });
  });
}

export interface DeleteMediaPathResult {
  deletedPath: string;
  mediaDeleted: boolean;
  remainingPaths: number;
}

export async function deleteMediaPath(
  fileHash: string,
  filePath: string,
): Promise<DeleteMediaPathResult> {
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const media = await tx.media.findUnique({
      where: { fileHash },
      include: { paths: true },
    });
    if (!media) {
      throw new Error("Media record not found");
    }
    const path = media.paths.find((item) => item.filePath === filePath);
    if (!path) {
      throw new Error("Path does not belong to this media item");
    }

    await tx.mediaPath.delete({ where: { id: path.id } });
    const remaining = media.paths.filter((item) => item.id !== path.id);
    if (remaining.length === 0) {
      await tx.media.delete({ where: { fileHash } });
    } else if (media.filePath === filePath) {
      const next = remaining[0];
      if (next) {
        await tx.media.update({
          where: { fileHash },
          data: { filePath: next.filePath, fileName: next.fileName },
        });
      }
    }
    return {
      deletedPath: filePath,
      mediaDeleted: remaining.length === 0,
      remainingPaths: remaining.length,
    };
  });
}
