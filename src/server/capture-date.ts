import type { JsonObject, JsonValue } from "./types.js";

const DATE_KEYS = [
  "DateTimeOriginal",
  "CreateDate",
  "DateTimeDigitized",
] as const;

function parseDate(value: JsonValue): Date | null {
  if (typeof value !== "string") return null;
  const normalized = value
    .replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3")
    .replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function captureDateFromExif(exif: JsonObject | null): Date | null {
  if (!exif) return null;
  for (const key of DATE_KEYS) {
    const parsed = parseDate(exif[key] ?? null);
    if (parsed) return parsed;
  }
  return null;
}
