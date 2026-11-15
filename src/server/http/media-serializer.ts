import type { MediaRecord } from "../../shared/api-types.js";
import type { MediaWithPaths } from "../db/media-repo.js";

export function serializeMedia(media: MediaWithPaths): MediaRecord {
  return {
    fileHash: media.fileHash,
    filePath: media.filePath,
    fileName: media.fileName,
    mimeType: media.mimeType,
    sizeBytes: media.sizeBytes.toString(),
    width: media.width,
    height: media.height,
    dhash64: media.dhash64,
    phash64: media.phash64,
    title: media.title,
    description: media.description,
    category: media.category,
    favorite: media.favorite,
    tags: media.tags.map((tag) => tag.name).sort((left, right) => left.localeCompare(right)),
    albums: media.albums.map(({ album }) => ({ id: album.id, name: album.name })),
    exif: media.exif,
    capturedAt: media.capturedAt.toISOString(),
    createdAt: media.createdAt.toISOString(),
    updatedAt: media.updatedAt.toISOString(),
    paths: media.paths.map((path) => ({
      id: path.id,
      filePath: path.filePath,
      fileName: path.fileName,
    })),
  };
}
