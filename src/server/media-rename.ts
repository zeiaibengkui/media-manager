import { constants } from "node:fs";
import { access, rename, stat } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import type { MediaWithPaths } from "./db/media-repo.js";
import { findByFileHash } from "./db/media-repo.js";
import { updateMediaPathLocation } from "./db/media-path-repo.js";

export class MediaRenameError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function validateFileName(fileName: string, currentFileName: string): string {
  const trimmed = fileName.trim();
  if (
    !trimmed ||
    trimmed === "." ||
    trimmed === ".." ||
    trimmed !== basename(trimmed) ||
    trimmed.includes("\0") ||
    Buffer.byteLength(trimmed) > 255
  ) {
    throw new MediaRenameError(400, "INVALID_FILE_NAME", "fileName is not valid");
  }

  if (extname(trimmed).toLowerCase() !== extname(currentFileName).toLowerCase()) {
    throw new MediaRenameError(
      400,
      "EXTENSION_CHANGE_NOT_ALLOWED",
      "Renaming cannot change the file extension",
    );
  }

  return trimmed;
}

export async function renameMediaFile(
  fileHash: string,
  requestedFileName: string,
): Promise<MediaWithPaths> {
  const media = await findByFileHash(fileHash);
  if (!media) {
    throw new MediaRenameError(404, "MEDIA_NOT_FOUND", "Media record not found");
  }

  const fileName = validateFileName(requestedFileName, media.fileName);
  const targetPath = join(dirname(media.filePath), fileName);
  if (targetPath === media.filePath) {
    return media;
  }

  try {
    await access(media.filePath, constants.F_OK);
    await stat(media.filePath);
  } catch {
    throw new MediaRenameError(
      404,
      "MEDIA_FILE_NOT_FOUND",
      "The source media file no longer exists",
    );
  }

  try {
    await access(targetPath, constants.F_OK);
    throw new MediaRenameError(
      409,
      "FILE_NAME_CONFLICT",
      "A file with the requested name already exists",
    );
  } catch (error) {
    if (error instanceof MediaRenameError) {
      throw error;
    }
  }

  await rename(media.filePath, targetPath);
  try {
    return await updateMediaPathLocation(fileHash, media.filePath, targetPath, fileName);
  } catch (error) {
    try {
      await rename(targetPath, media.filePath);
    } catch (rollbackError) {
      console.error("Failed to roll back file rename:", rollbackError);
    }
    throw error;
  }
}
