import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";
import type { MediaListResponse } from "../../shared/api-types.js";
import { listMedia } from "../db/media-list-repo.js";
import { findByFileHash } from "../db/media-repo.js";
import {
  decodeMediaCursor,
  encodeMediaCursor,
} from "../media-cursor.js";
import { ApiRequestError } from "./errors.js";
import { readJsonBody, sendJson } from "./io.js";
import { applyMediaPatch } from "./media-patch.js";
import { serializeMedia } from "./media-serializer.js";

async function sendMediaContent(
  response: ServerResponse,
  fileHash: string,
): Promise<void> {
  const media = await findByFileHash(fileHash);
  if (!media) {
    throw new ApiRequestError(404, "MEDIA_NOT_FOUND", "Media record not found");
  }

  let fileSize: number;
  try {
    fileSize = (await stat(media.filePath)).size;
  } catch {
    throw new ApiRequestError(404, "MEDIA_FILE_NOT_FOUND", "The source media file no longer exists");
  }

  response.writeHead(200, {
    "Cache-Control": "private, max-age=60",
    "Content-Length": fileSize,
    "Content-Type": media.mimeType,
    "X-Content-Type-Options": "nosniff",
  });
  createReadStream(media.filePath).pipe(response);
}

export async function handleMediaRoutes(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (request.method === "GET" && url.pathname === "/api/media") {
    const limit = Number(url.searchParams.get("limit") ?? "50");
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      throw new ApiRequestError(400, "INVALID_LIMIT", "limit must be an integer from 1 to 500");
    }
    const rawCursor = url.searchParams.get("cursor");
    const cursor = rawCursor ? decodeMediaCursor(rawCursor) : undefined;
    const favoriteOnly = url.searchParams.get("favorite") === "true";
    const albumId = url.searchParams.get("albumId") ?? undefined;
    const rows = await listMedia(limit + 1, cursor, {
      ...(favoriteOnly ? { favoriteOnly } : {}),
      ...(albumId ? { albumId } : {}),
    });
    const media = rows.slice(0, limit);
    const last = media.at(-1);
    const body: MediaListResponse = {
      count: media.length,
      items: media.map(serializeMedia),
      hasMore: rows.length > limit,
      nextCursor: rows.length > limit && last
        ? encodeMediaCursor({
            capturedAt: last.capturedAt.toISOString(),
            fileHash: last.fileHash,
          })
        : null,
    };
    sendJson(response, 200, body);
    return true;
  }

  const contentMatch = /^\/api\/media\/([^/]+)\/content$/.exec(url.pathname);
  if (request.method === "GET" && contentMatch?.[1]) {
    await sendMediaContent(response, decodeURIComponent(contentMatch[1]));
    return true;
  }

  const mediaMatch = /^\/api\/media\/([^/]+)$/.exec(url.pathname);
  if (request.method === "PATCH" && mediaMatch?.[1]) {
    const body = await readJsonBody(request);
    const media = await applyMediaPatch(decodeURIComponent(mediaMatch[1]), body);
    sendJson(response, 200, serializeMedia(media));
    return true;
  }

  if (request.method === "GET" && mediaMatch?.[1]) {
    const media = await findByFileHash(decodeURIComponent(mediaMatch[1]));
    if (!media) {
      throw new ApiRequestError(404, "MEDIA_NOT_FOUND", "Media record not found");
    }
    sendJson(response, 200, serializeMedia(media));
    return true;
  }

  return false;
}
