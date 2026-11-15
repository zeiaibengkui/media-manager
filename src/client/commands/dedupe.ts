import type { Command } from "commander";
import { InvalidArgumentError } from "commander";
import { MediaApiClient } from "../api-client.js";
import type { ClientGlobalOptions } from "../types.js";

interface DedupeOptions {
  threshold: number;
}

function parseThreshold(value: string): number {
  const threshold = Number(value);
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    throw new InvalidArgumentError("Threshold must be a number between 0 and 1");
  }
  return threshold;
}

export function registerDedupe(program: Command): void {
  program
    .command("dedupe")
    .description("Find likely duplicate media records through the server")
    .option("--threshold <number>", "Near-duplicate threshold (0-1)", parseThreshold, 0.9)
    .action(async (options: DedupeOptions, command: Command) => {
      try {
        const globals = command.optsWithGlobals() as ClientGlobalOptions;
        const client = new MediaApiClient(globals.apiUrl, globals.token);
        const result = await client.getDuplicates(options.threshold);

        if (result.count === 0) {
          console.log("No near-duplicate candidates met the threshold.");
          return;
        }

        console.log(`Found ${result.count} near-duplicate candidate pair(s):`);
        for (const pair of result.candidates) {
          console.log(
            `- ${pair.left.filePath} <-> ${pair.right.filePath} ` +
            `similarity ${(pair.similarity * 100).toFixed(1)}%`,
          );
        }
      } catch (error) {
        console.error("Near-duplicate request failed:", error);
        process.exitCode = 1;
      }
    });
}
