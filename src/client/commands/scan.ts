import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import type { Command } from "commander";
import { InvalidArgumentError } from "commander";
import { MediaApiClient } from "../api-client.js";
import type { ClientGlobalOptions } from "../types.js";
import type { ScanJob } from "../../shared/api-types.js";
import {
  DEFAULT_AI_PROMPT,
  DEFAULT_SCAN_CONCURRENCY,
  MAX_SCAN_CONCURRENCY,
} from "../../shared/api-types.js";

interface ScanCommandOptions {
  skipAi?: boolean;
  skipExif?: boolean;
  nearThreshold: number;
  concurrency: number;
  aiPrompt: string;
}

function parseThreshold(value: string): number {
  const threshold = Number(value);
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    throw new InvalidArgumentError("Threshold must be a number between 0 and 1");
  }
  return threshold;
}

function isTerminal(job: ScanJob): boolean {
  return job.status === "completed" || job.status === "failed";
}

function parseConcurrency(value: string): number {
  const concurrency = Number(value);
  if (
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > MAX_SCAN_CONCURRENCY
  ) {
    throw new InvalidArgumentError(
      `Concurrency must be an integer from 1 to ${MAX_SCAN_CONCURRENCY}`,
    );
  }
  return concurrency;
}

export function registerScan(program: Command): void {
  program
    .command("scan <dir>")
    .description("Recursively scan an image directory through the server")
    .option("--skip-exif", "Skip EXIF extraction")
    .option("--skip-ai", "Skip AI description generation")
    .option("--near-threshold <number>", "Near-duplicate threshold (0-1)", parseThreshold, 0.9)
    .option(
      "--concurrency <number>",
      `Number of files processed at once (1-${MAX_SCAN_CONCURRENCY})`,
      parseConcurrency,
      DEFAULT_SCAN_CONCURRENCY,
    )
    .option(
      "--ai-prompt <prompt>",
      "Prompt used for AI image descriptions",
      DEFAULT_AI_PROMPT,
    )
    .action(async (
      dir: string,
      options: ScanCommandOptions,
      command: Command,
    ) => {
      try {
        const globals = command.optsWithGlobals() as ClientGlobalOptions;
        const client = new MediaApiClient(globals.apiUrl, globals.token);
        const job = await client.startScan({
          path: resolve(dir),
          skipAi: options.skipAi ?? false,
          skipExif: options.skipExif ?? false,
          nearThreshold: options.nearThreshold,
          concurrency: options.concurrency,
          aiPrompt: options.aiPrompt,
        });

        console.log(`Scan job created: ${job.id}`);
        let printedEvents = 0;

        while (true) {
          const current = await client.getScan(job.id);
          for (const event of current.events.slice(printedEvents)) {
            const write = event.type === "warning" ? console.warn : console.log;
            write(event.message);
          }
          printedEvents = current.events.length;

          if (isTerminal(current)) {
            if (current.status === "failed") {
              console.error(`Scan job failed: ${current.error ?? "Unknown error"}`);
              process.exitCode = 1;
            } else if (current.summary) {
              console.log(
                `Scan completed: ${current.summary.scanned} scanned, ` +
                `${current.summary.created} created, ` +
                `${current.summary.exactDuplicates} exact duplicates, ` +
                `${current.summary.nearDuplicateMatches} near-duplicate matches, ` +
                `${current.summary.failed} failed.`,
              );
              if (current.summary.failed > 0) {
                process.exitCode = 1;
              }
            }
            return;
          }

          await delay(500);
        }
      } catch (error) {
        console.error("Scan request failed:", error);
        process.exitCode = 1;
      }
    });
}
