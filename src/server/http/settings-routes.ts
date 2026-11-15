import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";
import type { PersistedSettings } from "../../shared/api-types.js";
import { getSettings, saveSettings } from "../db/settings-repo.js";
import { ApiRequestError } from "./errors.js";
import { isRecord, readJsonBody, sendJson } from "./io.js";
import { parseThreshold } from "./scan-request.js";

function parseSettings(value: unknown): PersistedSettings {
  if (!isRecord(value)) {
    throw new ApiRequestError(400, "INVALID_BODY", "Settings must be a JSON object");
  }
  if (typeof value.aiPrompt !== "string" || value.aiPrompt.trim().length > 500) {
    throw new ApiRequestError(400, "INVALID_AI_PROMPT", "aiPrompt must be at most 500 characters");
  }
  if (!Number.isInteger(value.concurrency) || Number(value.concurrency) < 1 || Number(value.concurrency) > 20) {
    throw new ApiRequestError(400, "INVALID_CONCURRENCY", "concurrency must be from 1 to 20");
  }
  if (typeof value.skipAi !== "boolean" || typeof value.skipExif !== "boolean") {
    throw new ApiRequestError(400, "INVALID_SETTINGS", "skip settings must be booleans");
  }

  return {
    aiPrompt: value.aiPrompt.trim(),
    concurrency: Number(value.concurrency),
    nearThreshold: parseThreshold(value.nearThreshold),
    skipAi: value.skipAi,
    skipExif: value.skipExif,
  };
}

export async function handleSettingsRoutes(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (url.pathname !== "/api/settings") {
    return false;
  }
  if (request.method === "GET") {
    sendJson(response, 200, await getSettings());
    return true;
  }
  if (request.method === "PUT") {
    sendJson(response, 200, await saveSettings(parseSettings(await readJsonBody(request))));
    return true;
  }
  return false;
}
