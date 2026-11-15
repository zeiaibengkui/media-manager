import { ApiRequestError } from "./http/errors.js";

export interface MediaCursor {
  capturedAt: string;
  fileHash: string;
}

export function encodeMediaCursor(cursor: MediaCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeMediaCursor(value: string): MediaCursor {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as MediaCursor).capturedAt === "string" &&
      typeof (parsed as MediaCursor).fileHash === "string" &&
      !Number.isNaN(new Date((parsed as MediaCursor).capturedAt).getTime())
    ) {
      return parsed as MediaCursor;
    }
  } catch {
    // Fall through to the API error below.
  }
  throw new ApiRequestError(400, "INVALID_CURSOR", "Invalid media cursor");
}
