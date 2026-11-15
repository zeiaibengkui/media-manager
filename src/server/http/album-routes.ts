import type { IncomingMessage, ServerResponse } from "node:http";
import type { AlbumListResponse } from "../../shared/api-types.js";
import { Prisma as PrismaNamespace } from "../../generated/prisma/client.js";
import {
  addMediaToAlbum,
  createAlbum,
  deleteAlbum,
  findAlbum,
  listAlbums,
  removeMediaFromAlbum,
} from "../db/album-repo.js";
import { findByFileHash } from "../db/media-repo.js";
import { ApiRequestError } from "./errors.js";
import { isRecord, readJsonBody, sendJson } from "./io.js";
import { serializeAlbum } from "./album-serializer.js";
import { serializeMedia } from "./media-serializer.js";

function parseAlbumName(body: unknown): string {
  if (!isRecord(body) || typeof body.name !== "string") {
    throw new ApiRequestError(400, "INVALID_BODY", "name must be a string");
  }
  const name = body.name.trim();
  if (!name || name.length > 80) {
    throw new ApiRequestError(
      400,
      "INVALID_ALBUM_NAME",
      "Album name must contain 1 to 80 characters",
    );
  }
  return name;
}

async function requireAlbum(albumId: string): Promise<void> {
  if (!(await findAlbum(albumId))) {
    throw new ApiRequestError(404, "ALBUM_NOT_FOUND", "Album not found");
  }
}

export async function handleAlbumRoutes(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (url.pathname === "/api/albums" && request.method === "GET") {
    const items = (await listAlbums()).map(serializeAlbum);
    const body: AlbumListResponse = { count: items.length, items };
    sendJson(response, 200, body);
    return true;
  }

  if (url.pathname === "/api/albums" && request.method === "POST") {
    const name = parseAlbumName(await readJsonBody(request));
    try {
      sendJson(response, 201, serializeAlbum(await createAlbum(name)));
    } catch (error) {
      if (
        error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ApiRequestError(409, "ALBUM_NAME_CONFLICT", "An album with this name exists");
      }
      throw error;
    }
    return true;
  }

  const albumMatch = /^\/api\/albums\/([^/]+)$/.exec(url.pathname);
  if (request.method === "GET" && albumMatch?.[1]) {
    const album = await findAlbum(decodeURIComponent(albumMatch[1]));
    if (!album) {
      throw new ApiRequestError(404, "ALBUM_NOT_FOUND", "Album not found");
    }
    sendJson(response, 200, serializeAlbum(album));
    return true;
  }

  if (request.method === "DELETE" && albumMatch?.[1]) {
    const albumId = decodeURIComponent(albumMatch[1]);
    try {
      await deleteAlbum(albumId);
      response.writeHead(204);
      response.end();
    } catch (error) {
      if (
        error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new ApiRequestError(404, "ALBUM_NOT_FOUND", "Album not found");
      }
      throw error;
    }
    return true;
  }

  const mediaMatch = /^\/api\/albums\/([^/]+)\/media\/([^/]+)$/.exec(url.pathname);
  if ((request.method === "POST" || request.method === "DELETE") && mediaMatch?.[1] && mediaMatch[2]) {
    const albumId = decodeURIComponent(mediaMatch[1]);
    const fileHash = decodeURIComponent(mediaMatch[2]);
    await requireAlbum(albumId);
    if (!(await findByFileHash(fileHash))) {
      throw new ApiRequestError(404, "MEDIA_NOT_FOUND", "Media record not found");
    }
    if (request.method === "POST") await addMediaToAlbum(albumId, fileHash);
    else await removeMediaFromAlbum(albumId, fileHash);
    const media = await findByFileHash(fileHash);
    if (!media) throw new ApiRequestError(404, "MEDIA_NOT_FOUND", "Media record not found");
    sendJson(response, 200, serializeMedia(media));
    return true;
  }
  return false;
}
