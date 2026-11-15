import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { sniffFormat } from "duplicate-image-detector";
import { describeImage } from "../ai/describe.js";
import { create, findByFileHash, listPerceptualHashes } from "../db/media-repo.js";
import { addMediaPath } from "../db/media-path-repo.js";
import {
  createFileHash,
  createPerceptualFingerprint,
  findNearMatchesForHash,
} from "../dedupe/hasher.js";
import { extractExif } from "../exif/extract.js";
import { captureDateFromExif } from "../capture-date.js";
import type {
  AiGenerationResult,
  ProcessImageOptions,
  ProcessResult,
} from "../types.js";

const MIME_TYPES = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  bmp: "image/bmp",
  webp: "image/webp",
} as const;

function detectMimeType(buffer: Buffer, fileName: string): string {
  const format = sniffFormat(buffer);
  if (format) {
    return MIME_TYPES[format];
  }

  throw new Error(
    `Unsupported image format: ${fileName} (${extname(fileName) || "no extension"})`,
  );
}

export async function processImage(
  filePath: string,
  options: ProcessImageOptions,
): Promise<ProcessResult> {
  const absolutePath = resolve(filePath);
  const fileName = basename(absolutePath);
  const buffer = await readFile(absolutePath);
  const fileHash = createFileHash(buffer);
  const existing = await findByFileHash(fileHash);

  if (existing) {
    await addMediaPath(fileHash, absolutePath, fileName);
    return {
      status: "exact-duplicate",
      filePath: absolutePath,
      media: existing,
      nearDuplicates: [],
    };
  }

  const perceptual = createPerceptualFingerprint(buffer);
  const existingHashes = await listPerceptualHashes();
  const nearDuplicates = findNearMatchesForHash(
    {
      dhash64: perceptual.dhash64,
      phash64: perceptual.phash64,
    },
    existingHashes,
    options.nearThreshold,
  );
  const mimeType = detectMimeType(buffer, fileName);

  const emptyAiResult: AiGenerationResult = {
    title: null,
    description: null,
  };
  const [aiResult, exif] = await Promise.all([
    options.skipAi
      ? Promise.resolve(emptyAiResult)
      : describeImage(buffer, mimeType, fileName, options.aiPrompt, options.signal),
    options.skipExif
      ? Promise.resolve(null)
      : extractExif(buffer, fileName),
  ]);

  const createResult = await create({
    fileHash,
    filePath: absolutePath,
    fileName,
    mimeType,
    sizeBytes: BigInt(buffer.byteLength),
    width: perceptual.fingerprint.w,
    height: perceptual.fingerprint.h,
    dhash64: perceptual.dhash64,
    phash64: perceptual.phash64,
    title: aiResult.title,
    description: aiResult.description,
    exif,
    capturedAt: captureDateFromExif(exif) ?? new Date(),
  });

  if (!createResult.created) {
    await addMediaPath(fileHash, absolutePath, fileName);
  }

  return {
    status: createResult.created ? "created" : "exact-duplicate",
    filePath: absolutePath,
    media: createResult.media,
    nearDuplicates: createResult.created ? nearDuplicates : [],
  };
}
