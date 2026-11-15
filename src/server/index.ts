#!/usr/bin/env tsx

import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createMediaServer } from "./api.js";
import { disconnectDb } from "./db/prisma.js";

dotenv.config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
  quiet: true,
});

const host = process.env.MEDIA_MANAGER_HOST ?? "127.0.0.1";
const port = Number(process.env.MEDIA_MANAGER_PORT ?? "4318");

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  console.error("MEDIA_MANAGER_PORT must be an integer between 1 and 65535");
  process.exitCode = 1;
} else {
  const server = createMediaServer();
  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    console.log(`Received ${signal}; shutting down.`);

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await disconnectDb();
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  server.on("error", (error) => {
    console.error("Failed to start REST API server:", error);
    process.exitCode = 1;
  });

  server.listen(port, host, () => {
    console.log(`Media Manager REST API listening at http://${host}:${port}/api/health`);
  });
}
