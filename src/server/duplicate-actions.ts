import { unlink } from "node:fs/promises";
import type {
  ResolveDuplicateRequest,
  ResolveDuplicateResponse,
} from "../shared/api-types.js";
import { findByFileHash } from "./db/media-repo.js";
import { deleteMediaPath } from "./db/media-path-repo.js";
import { saveDecision } from "./db/duplicate-decision-repo.js";

export class DuplicateActionError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function resolveDuplicate(
  request: ResolveDuplicateRequest,
): Promise<ResolveDuplicateResponse> {
  if (request.action === "keep-both") {
    await saveDecision(request.leftHash, request.rightHash, "keep-both");
    return {
      decision: "keep-both",
      deletedPath: null,
      mediaDeleted: false,
      remainingPaths: 0,
    };
  }

  if (
    !request.removeHash ||
    !request.removeFilePath ||
    ![request.leftHash, request.rightHash].includes(request.removeHash)
  ) {
    throw new DuplicateActionError(
      400,
      "INVALID_REMOVAL",
      "removeHash and removeFilePath must identify one side of the pair",
    );
  }

  const media = await findByFileHash(request.removeHash);
  const path = media?.paths.find((item) => item.filePath === request.removeFilePath);
  if (!media || !path) {
    throw new DuplicateActionError(404, "PATH_NOT_FOUND", "Selected file path was not found");
  }

  try {
    await unlink(path.filePath);
  } catch {
    throw new DuplicateActionError(404, "FILE_NOT_FOUND", "Selected file no longer exists");
  }

  const result = await deleteMediaPath(media.fileHash, path.filePath);
  await saveDecision(request.leftHash, request.rightHash, "removed");
  return {
    decision: "removed",
    ...result,
  };
}
