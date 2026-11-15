import type { MediaPatchRequest } from "../../shared/api-types.js";
import { updateMediaMetadata } from "../db/media-metadata-repo.js";
import { findByFileHash } from "../db/media-repo.js";
import type { MediaWithPaths } from "../db/media-repo.js";
import { MediaRenameError, renameMediaFile } from "../media-rename.js";
import { ApiRequestError } from "./errors.js";
import { isRecord } from "./io.js";

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 30) {
    throw new ApiRequestError(400, "INVALID_TAGS", "tags must be an array of up to 30 names");
  }
  const tags = new Map<string, string>();
  for (const tag of value) {
    if (typeof tag !== "string" || !tag.trim() || tag.trim().length > 40) {
      throw new ApiRequestError(
        400,
        "INVALID_TAGS",
        "Each tag must be a non-empty string of at most 40 characters",
      );
    }
    const name = tag.trim();
    tags.set(name.toLowerCase(), name);
  }
  return [...tags.values()];
}

function parsePatch(body: unknown): {
  fileName?: string;
  metadata: Pick<MediaPatchRequest, "favorite" | "category" | "tags">;
} {
  if (!isRecord(body)) {
    throw new ApiRequestError(400, "INVALID_BODY", "A JSON object is required");
  }
  if (body.fileName !== undefined && typeof body.fileName !== "string") {
    throw new ApiRequestError(400, "INVALID_FILE_NAME", "fileName must be a string");
  }
  if (body.favorite !== undefined && typeof body.favorite !== "boolean") {
    throw new ApiRequestError(400, "INVALID_FAVORITE", "favorite must be a boolean");
  }
  if (
    body.category !== undefined &&
    body.category !== null &&
    (typeof body.category !== "string" || body.category.trim().length > 80)
  ) {
    throw new ApiRequestError(
      400,
      "INVALID_CATEGORY",
      "category must be null or a string of at most 80 characters",
    );
  }
  const metadata: Pick<MediaPatchRequest, "favorite" | "category" | "tags"> = {};
  if (body.favorite !== undefined) metadata.favorite = body.favorite;
  if (body.category !== undefined) metadata.category = body.category as string | null;
  if (body.tags !== undefined) metadata.tags = parseTags(body.tags);
  if (body.fileName === undefined && Object.keys(metadata).length === 0) {
    throw new ApiRequestError(400, "INVALID_BODY", "At least one media field is required");
  }
  return {
    ...(body.fileName === undefined ? {} : { fileName: body.fileName }),
    metadata,
  };
}

export async function applyMediaPatch(
  fileHash: string,
  body: unknown,
): Promise<MediaWithPaths> {
  const patch = parsePatch(body);
  let media = await findByFileHash(fileHash);
  if (!media) {
    throw new ApiRequestError(404, "MEDIA_NOT_FOUND", "Media record not found");
  }
  try {
    if (patch.fileName !== undefined) {
      media = await renameMediaFile(fileHash, patch.fileName);
    }
  } catch (error) {
    if (error instanceof MediaRenameError) {
      throw new ApiRequestError(error.status, error.code, error.message);
    }
    throw error;
  }
  return Object.keys(patch.metadata).length
    ? updateMediaMetadata(fileHash, patch.metadata)
    : media;
}
