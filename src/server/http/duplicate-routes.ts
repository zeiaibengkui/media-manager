import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";
import type {
  DuplicatesResponse,
  ResolveDuplicateRequest,
} from "../../shared/api-types.js";
import { DUPLICATE_BATCH_LIMIT } from "../../shared/api-types.js";
import { listPerceptualHashes } from "../db/media-repo.js";
import { listDecisions } from "../db/duplicate-decision-repo.js";
import { findNearDuplicates } from "../dedupe/hasher.js";
import {
  DuplicateActionError,
  resolveDuplicate,
} from "../duplicate-actions.js";
import { ApiRequestError } from "./errors.js";
import { isRecord, readJsonBody, sendJson } from "./io.js";
import { parseThreshold } from "./scan-request.js";

export async function handleDuplicateRoutes(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (request.method === "POST" && url.pathname === "/api/duplicates/decisions") {
    const body = await readJsonBody(request);
    if (
      !isRecord(body) ||
      typeof body.leftHash !== "string" ||
      typeof body.rightHash !== "string" ||
      (body.action !== "keep-both" && body.action !== "remove-one")
    ) {
      throw new ApiRequestError(400, "INVALID_BODY", "Invalid duplicate decision");
    }
    const decision = body as unknown as ResolveDuplicateRequest;
    try {
      sendJson(response, 200, await resolveDuplicate(decision));
    } catch (error) {
      if (error instanceof DuplicateActionError) {
        throw new ApiRequestError(error.status, error.code, error.message);
      }
      throw error;
    }
    return true;
  }
  if (request.method !== "GET" || url.pathname !== "/api/duplicates") {
    return false;
  }

  const threshold = parseThreshold(url.searchParams.get("threshold") ?? undefined);
  const decisions = await listDecisions();
  const search = findNearDuplicates(
    await listPerceptualHashes(),
    threshold,
    decisions,
    DUPLICATE_BATCH_LIMIT,
  );
  const pairs = search.pairs;
  const body: DuplicatesResponse = {
    threshold,
    count: pairs.length,
    hasMore: search.hasMore,
    candidates: pairs.map((pair) => ({
      left: {
        fileHash: pair.left.fileHash,
        filePath: pair.left.filePath,
        fileName: pair.left.fileName,
      },
      right: {
        fileHash: pair.right.fileHash,
        filePath: pair.right.filePath,
        fileName: pair.right.fileName,
      },
      similarity: pair.similarity,
      dhashSimilarity: pair.right.dhashSimilarity,
      phashSimilarity: pair.right.phashSimilarity,
    })),
  };
  sendJson(response, 200, body);
  return true;
}
