import type { Command } from "commander";
import { MediaApiClient } from "../api-client.js";
import type { ClientGlobalOptions } from "../types.js";

export function registerStatus(program: Command): void {
  program
    .command("status")
    .description("Check Media Manager server status")
    .action(async (_options: unknown, command: Command) => {
      try {
        const globals = command.optsWithGlobals() as ClientGlobalOptions;
        const client = new MediaApiClient(globals.apiUrl, globals.token);
        const health = await client.health();
        console.log(`${health.service} ${health.version}: ${health.status}`);
      } catch (error) {
        console.error("Service unavailable:", error);
        process.exitCode = 1;
      }
    });
}
