import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";
import type { ApiErrorBody } from "../../shared/api-types.js";
import { ApiRequestError } from "./errors.js";

const MAX_BODY_BYTES = 1024 * 1024;

export function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown,
): void {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload),
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(payload);
}

export function sendError(
  response: ServerResponse,
  error: ApiRequestError,
): void {
  const body: ApiErrorBody = {
    error: {
      code: error.code,
      message: error.message,
    },
  };
  sendJson(response, error.status, body);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      throw new ApiRequestError(413, "BODY_TOO_LARGE", "Request body exceeds 1 MiB");
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new ApiRequestError(400, "INVALID_JSON", "Request body is not valid JSON");
  }
}
