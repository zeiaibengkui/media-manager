import "dotenv/config";

import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    // PGlite is connected in-process by prisma-pglite; this placeholder is only
    // required by Prisma's migration/introspection configuration.
    url: "postgresql://localhost:5432/pglite",
  },
});
