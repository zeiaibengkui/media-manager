import { Command } from "commander";
import { registerDedupe } from "./commands/dedupe.js";
import { registerScan } from "./commands/scan.js";
import { registerStatus } from "./commands/status.js";

export function createClientProgram(): Command {
  const program = new Command()
    .name("media-manager")
    .description("Media Manager REST API client")
    .version("0.1.0")
    .option(
      "--api-url <url>",
      "Server API base URL",
      process.env.MEDIA_MANAGER_API_URL ?? "http://127.0.0.1:4318",
    )
    .option(
      "--token <token>",
      "API bearer token (or use MEDIA_MANAGER_API_TOKEN)",
      process.env.MEDIA_MANAGER_API_TOKEN,
    );

  registerStatus(program);
  registerScan(program);
  registerDedupe(program);

  return program;
}
