import {
  DEFAULT_AI_PROMPT,
  DEFAULT_SCAN_CONCURRENCY,
  MAX_SCAN_CONCURRENCY,
  type ScanRequest,
} from "../../shared/api-types.js";
import { ApiRequestError } from "./errors.js";
import { isRecord } from "./io.js";

export function parseThreshold(value: unknown, fallback = 0.9): number {
  if (value === undefined) {
    return fallback;
  }

  const threshold = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    throw new ApiRequestError(
      400,
      "INVALID_THRESHOLD",
      "Threshold must be a number between 0 and 1",
    );
  }
  return threshold;
}

export function parseScanRequest(value: unknown): ScanRequest {
  if (!isRecord(value)) {
    throw new ApiRequestError(400, "INVALID_BODY", "Request body must be a JSON object");
  }
  if (typeof value.path !== "string" || value.path.trim() === "") {
    throw new ApiRequestError(400, "INVALID_PATH", "path must be a non-empty string");
  }

  for (const key of ["skipAi", "skipExif"] as const) {
    if (value[key] !== undefined && typeof value[key] !== "boolean") {
      throw new ApiRequestError(400, "INVALID_BODY", `${key} must be a boolean`);
    }
  }

  const concurrency = value.concurrency === undefined
    ? DEFAULT_SCAN_CONCURRENCY
    : Number(value.concurrency);
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > MAX_SCAN_CONCURRENCY) {
    throw new ApiRequestError(
      400,
      "INVALID_CONCURRENCY",
      `concurrency must be an integer from 1 to ${MAX_SCAN_CONCURRENCY}`,
    );
  }

  const aiPrompt = value.aiPrompt === undefined
    ? DEFAULT_AI_PROMPT
    : typeof value.aiPrompt === "string"
      ? value.aiPrompt.trim()
      : null;
  if (aiPrompt === null || aiPrompt.length > 500) {
    throw new ApiRequestError(
      400,
      "INVALID_AI_PROMPT",
      "aiPrompt must be a string up to 500 characters",
    );
  }

  return {
    path: value.path,
    skipAi: value.skipAi === true,
    skipExif: value.skipExif === true,
    nearThreshold: parseThreshold(value.nearThreshold),
    concurrency,
    aiPrompt: aiPrompt || process.env.DESCRIPTION_PROMPT?.trim() || DEFAULT_AI_PROMPT,
  };
}
