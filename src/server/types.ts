import type { Fingerprint } from "duplicate-image-detector";
import type { Media } from "../generated/prisma/client.js";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export interface PerceptualHashes {
  dhash64: string;
  phash64: string;
}

export interface HashedPerceptualMedia extends PerceptualHashes {
  fileHash: string;
  filePath: string;
  fileName: string;
}

export interface DuplicateCandidate {
  fileHash: string;
  filePath: string;
  fileName: string;
  dhash64: string | null;
  phash64: string | null;
  similarity: number;
  dhashSimilarity: number | null;
  phashSimilarity: number | null;
}

export interface NearDuplicatePair {
  left: HashedPerceptualMedia;
  right: DuplicateCandidate;
  similarity: number;
}

export type ProcessStatus = "created" | "exact-duplicate";

export interface ProcessResult {
  status: ProcessStatus;
  filePath: string;
  media: Media;
  nearDuplicates: DuplicateCandidate[];
}

export interface AiGenerationResult {
  title: string | null;
  description: string | null;
}

export interface ProcessImageOptions {
  skipAi: boolean;
  skipExif: boolean;
  nearThreshold: number;
  aiPrompt: string;
  signal?: AbortSignal;
}

export interface FingerprintResult {
  fingerprint: Fingerprint;
  dhash64: string;
  phash64: string;
}
