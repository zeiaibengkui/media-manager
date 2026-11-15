import { createHash } from "node:crypto";
import { fingerprint } from "duplicate-image-detector";
import type { FingerprintResult } from "../types.js";

const MAX_IMAGE_PIXELS = 40_000_000;

export { findNearDuplicates, findNearMatchesForHash } from "./near-hash.js";

export function createFileHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function createPerceptualFingerprint(buffer: Buffer): FingerprintResult {
  const result = fingerprint(buffer, {
    methods: ["dhash64", "phash64"],
    preset: "photo",
    maxPixels: MAX_IMAGE_PIXELS,
  });
  if (!result.dhash64 || !result.phash64) {
    throw new Error("Could not generate dHash/pHash for the image");
  }
  return {
    fingerprint: result,
    dhash64: result.dhash64,
    phash64: result.phash64,
  };
}
