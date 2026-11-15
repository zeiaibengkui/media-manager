#!/usr/bin/env tsx

import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createClientProgram } from "./cli.js";

dotenv.config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
  quiet: true,
});

await createClientProgram().parseAsync();
