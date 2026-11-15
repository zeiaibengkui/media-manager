import { readdir, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import type {
  ScanEvent,
  ScanRequest,
  ScanSummary,
} from "../shared/api-types.js";
import { DUPLICATE_BATCH_LIMIT } from "../shared/api-types.js";
import { processImage } from "./pipeline/process-image.js";

const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".bmp"]);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function walkImages(directory: string): Promise<string[]> {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });
  const files: string[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkImages(fullPath));
    } else if (entry.isFile() && SUPPORTED_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  signal: AbortSignal,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;

  const runWorker = async (): Promise<void> => {
    while (true) {
      if (signal.aborted) return;
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) {
        return;
      }
      await worker(items[index] as T);
    }
  };

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(
    Array.from({ length: workerCount }, () => runWorker()),
  );
}

export async function scanDirectory(
  request: ScanRequest,
  emit: (event: ScanEvent) => void,
  signal: AbortSignal,
): Promise<ScanSummary> {
  const root = resolve(request.path);
  const rootStat = await stat(root);
  if (!rootStat.isDirectory()) {
    throw new Error(`Scan path is not a directory: ${root}`);
  }

  const files = await walkImages(root);
  const summary: ScanSummary = {
    scanned: 0,
    created: 0,
    exactDuplicates: 0,
    nearDuplicateMatches: 0,
    failed: 0,
  };

  emit({
    type: "info",
    message: `Found ${files.length} image(s) to process.`,
  });

  emit({
    type: "info",
    message: `Processing with concurrency ${request.concurrency}.`,
  });

  await runWithConcurrency(files, request.concurrency, signal, async (filePath) => {
    if (signal.aborted) return;
    summary.scanned += 1;
    try {
      const result = await processImage(filePath, {
        skipAi: request.skipAi,
        skipExif: request.skipExif,
        nearThreshold: request.nearThreshold,
        aiPrompt: request.aiPrompt,
        signal,
      });

      if (result.status === "created") {
        summary.created += 1;
        emit({
          type: "info",
          message: `Created: ${result.filePath}`,
        });
      } else {
        summary.exactDuplicates += 1;
        emit({
          type: "info",
          message: `Exact duplicate: ${result.filePath} -> ${result.media.filePath}`,
        });
      }

      if (result.nearDuplicates.length > 0) {
        summary.nearDuplicateMatches += result.nearDuplicates.length;
        const shown = result.nearDuplicates.slice(0, DUPLICATE_BATCH_LIMIT);
        const hidden = result.nearDuplicates.length - shown.length;
        emit({
          type: "warning",
          message:
            `Near-duplicate candidate: ${result.filePath} (${shown
              .map((candidate) => `${candidate.filePath} ${(candidate.similarity * 100).toFixed(1)}%`)
              .join(", ")}${hidden > 0 ? `, +${hidden} more` : ""})`,
        });
      }
    } catch (error) {
      summary.failed += 1;
      emit({
        type: "warning",
        message: `Processing failed: ${filePath}: ${errorMessage(error)}`,
      });
    }
  });

  if (signal.aborted) {
    throw new DOMException("Scan stopped by user", "AbortError");
  }

  return summary;
}
