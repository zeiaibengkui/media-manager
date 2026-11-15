import {
  hammingSimilarity,
  nearestByHamming,
} from "duplicate-image-detector";
import type {
  DuplicateCandidate,
  HashedPerceptualMedia,
  NearDuplicatePair,
  PerceptualHashes,
} from "../types.js";

const NEAR_MATCH_CANDIDATES = 20;

interface HashLookup {
  fileHash: string;
  filePath: string;
  fileName: string;
  similarity: number;
}

export interface PerceptualHashRecordSource {
  fileHash: string;
  filePath: string;
  fileName: string;
  dhash64: string | null;
  phash64: string | null;
}

export interface NearDuplicateSearch {
  pairs: NearDuplicatePair[];
  hasMore: boolean;
}

function collectLookups(
  records: PerceptualHashRecordSource[],
  kind: "dhash64" | "phash64",
  query: string,
  threshold: number,
): Map<string, HashLookup> {
  const hashItems = records.flatMap((record) => record[kind]
    ? [{ id: record.fileHash, hash: record[kind] }]
    : []);
  const matches = nearestByHamming(query, hashItems, {
    k: NEAR_MATCH_CANDIDATES,
    minSimilarity: Math.max(0, threshold - 0.1),
  });
  const recordsByHash = new Map(records.map((record) => [record.fileHash, record]));
  return new Map(matches.flatMap((match) => {
    const record = recordsByHash.get(match.id);
    return record
      ? [[match.id, {
          fileHash: record.fileHash,
          filePath: record.filePath,
          fileName: record.fileName,
          similarity: match.similarity,
        }] as const]
      : [];
  }));
}

function combineNearMatches(
  records: PerceptualHashRecordSource[],
  current: PerceptualHashes,
  dhashLookups: Map<string, HashLookup>,
  phashLookups: Map<string, HashLookup>,
  threshold: number,
): DuplicateCandidate[] {
  const recordsByHash = new Map(records.map((record) => [record.fileHash, record]));
  const candidates: DuplicateCandidate[] = [];

  for (const fileHash of new Set([...dhashLookups.keys(), ...phashLookups.keys()])) {
    const record = recordsByHash.get(fileHash);
    if (!record) continue;
    const dhashSimilarity = record.dhash64
      ? hammingSimilarity(current.dhash64, record.dhash64)
      : null;
    const phashSimilarity = record.phash64
      ? hammingSimilarity(current.phash64, record.phash64)
      : null;
    const values = [dhashSimilarity, phashSimilarity].filter(
      (value): value is number => value !== null,
    );
    const similarity = values.length
      ? values.reduce((total, value) => total + value, 0) / values.length
      : 0;
    if (similarity >= threshold) {
      candidates.push({
        fileHash: record.fileHash,
        filePath: record.filePath,
        fileName: record.fileName,
        dhash64: record.dhash64,
        phash64: record.phash64,
        similarity,
        dhashSimilarity,
        phashSimilarity,
      });
    }
  }
  return candidates.sort((left, right) => right.similarity - left.similarity);
}

export function findNearMatchesForHash(
  current: PerceptualHashes,
  records: PerceptualHashRecordSource[],
  threshold: number,
): DuplicateCandidate[] {
  return combineNearMatches(
    records,
    current,
    collectLookups(records, "dhash64", current.dhash64, threshold),
    collectLookups(records, "phash64", current.phash64, threshold),
    threshold,
  );
}

export function findNearDuplicates(
  records: PerceptualHashRecordSource[],
  threshold: number,
  excluded: Set<string> = new Set(),
  limit = Number.POSITIVE_INFINITY,
): NearDuplicateSearch {
  const candidates = new Map<string, NearDuplicatePair>();
  const scanLimit = Number.isFinite(limit) ? limit * 4 + 1 : Number.POSITIVE_INFINITY;
  outer: for (const [index, record] of records.entries()) {
    if (!record.dhash64 || !record.phash64) continue;
    const left: HashedPerceptualMedia = {
      fileHash: record.fileHash,
      filePath: record.filePath,
      fileName: record.fileName,
      dhash64: record.dhash64,
      phash64: record.phash64,
    };
    for (const right of findNearMatchesForHash(left, records.slice(index + 1), threshold)) {
      const key = [left.fileHash, right.fileHash].sort().join(":");
      if (excluded.has(key)) continue;
      candidates.set(key, {
        left,
        right,
        similarity: right.similarity,
      });
      if (candidates.size >= scanLimit) break outer;
    }
  }
  const sorted = [...candidates.values()].sort((left, right) => right.similarity - left.similarity);
  return {
    pairs: sorted.slice(0, limit),
    hasMore: sorted.length > limit,
  };
}
