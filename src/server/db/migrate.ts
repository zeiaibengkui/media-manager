#!/usr/bin/env tsx

import "dotenv/config";

import { fileURLToPath } from "node:url";
import { createPgliteMigration } from "prisma-pglite";

const migrationName = process.argv[2]?.trim();
if (!migrationName) {
  console.error("Usage: pnpm db:migrate <migration-name>");
  process.exitCode = 1;
} else {
  const migration = await createPgliteMigration({
    migrationName,
    prismaConfigPath: fileURLToPath(new URL("../../../prisma.config.ts", import.meta.url)),
  });

  if (migration) {
    console.log(`Migration created: ${migration.migrationDirPath}`);
  }
}
