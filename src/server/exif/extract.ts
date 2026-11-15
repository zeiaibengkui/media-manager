import exifr from "exifr";
import { sanitizeText } from "../text.js";
import type { JsonObject, JsonValue } from "../types.js";

function toJsonValue(value: unknown): JsonValue | undefined {
  if (typeof value === "string") {
    return sanitizeText(value);
  }

  if (value === null || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }

  if (Array.isArray(value)) {
    const items = value.flatMap((item) => {
      const converted = toJsonValue(item);
      return converted === undefined ? [] : [converted];
    });
    return items;
  }

  if (value instanceof Uint8Array) {
    return [...value];
  }

  if (typeof value === "object") {
    const output: JsonObject = {};
    for (const [key, item] of Object.entries(value)) {
      const sanitizedKey = sanitizeText(key);
      if (!sanitizedKey) continue;
      const converted = toJsonValue(item);
      if (converted !== undefined) {
        output[sanitizedKey] = converted;
      }
    }
    return output;
  }

  return undefined;
}

export async function extractExif(
  buffer: Buffer,
  fileName: string,
): Promise<JsonObject | null> {
  try {
    const parsed: unknown = await exifr.parse(buffer, {
      tiff: true,
      exif: true,
      gps: true,
      interop: true,
      xmp: true,
      iptc: true,
      jfif: true,
      ihdr: true,
      reviveValues: true,
      translateKeys: true,
      translateValues: true,
      sanitize: true,
    });
    const converted = toJsonValue(parsed);

    if (!converted || Array.isArray(converted) || typeof converted !== "object") {
      return null;
    }

    return Object.keys(converted).length > 0 ? converted : null;
  } catch (error) {
    console.warn(`EXIF extraction failed; continuing without metadata: ${fileName}`, error);
    return null;
  }
}
