import type { AppSettings } from "../../generated/prisma/client.js";
import {
  DEFAULT_AI_PROMPT,
  DEFAULT_SCAN_CONCURRENCY,
  type PersistedSettings,
} from "../../shared/api-types.js";
import { getPrisma } from "./prisma.js";

const SETTINGS_ID = "default";

export const DEFAULT_SETTINGS: PersistedSettings = {
  aiPrompt: DEFAULT_AI_PROMPT,
  concurrency: DEFAULT_SCAN_CONCURRENCY,
  nearThreshold: 0.9,
  skipAi: false,
  skipExif: false,
};

function toSettings(row: AppSettings): PersistedSettings {
  return {
    aiPrompt: row.aiPrompt,
    concurrency: row.concurrency,
    nearThreshold: row.nearThreshold,
    skipAi: row.skipAi,
    skipExif: row.skipExif,
  };
}

export async function getSettings(): Promise<PersistedSettings> {
  const prisma = await getPrisma();
  const row = await prisma.appSettings.findUnique({
    where: {
      id: SETTINGS_ID,
    },
  });
  if (row) {
    return toSettings(row);
  }

  const created = await prisma.appSettings.create({
    data: {
      id: SETTINGS_ID,
      ...DEFAULT_SETTINGS,
    },
  });
  return toSettings(created);
}

export async function saveSettings(
  settings: PersistedSettings,
): Promise<PersistedSettings> {
  const prisma = await getPrisma();
  const row = await prisma.appSettings.upsert({
    where: {
      id: SETTINGS_ID,
    },
    create: {
      id: SETTINGS_ID,
      ...settings,
    },
    update: settings,
  });
  return toSettings(row);
}
