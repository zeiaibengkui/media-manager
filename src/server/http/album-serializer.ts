import type { AlbumRecord } from "../../shared/api-types.js";
import type { AlbumWithCover } from "../db/album-repo.js";

export function serializeAlbum(album: AlbumWithCover): AlbumRecord {
  const cover = album.media[0]?.media;
  return {
    id: album.id,
    name: album.name,
    itemCount: album._count.media,
    coverFileHash: cover?.fileHash ?? null,
    coverFileName: cover?.fileName ?? null,
    createdAt: album.createdAt.toISOString(),
    updatedAt: album.updatedAt.toISOString(),
  };
}
