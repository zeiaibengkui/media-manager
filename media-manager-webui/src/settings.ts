import {
  DEFAULT_AI_PROMPT,
  DEFAULT_SCAN_CONCURRENCY,
  type PersistedSettings,
} from "../../src/shared/api-types.js";
import type { ApiSettings } from "./api.js";

export type ScanDefaults = PersistedSettings;

export interface AppSettings extends ApiSettings {
  scanDefaults: ScanDefaults;
}

export function defaultSettings(): AppSettings {
  return {
    apiUrl: import.meta.env.VITE_MEDIA_MANAGER_API_URL ?? "",
    token: import.meta.env.VITE_MEDIA_MANAGER_API_TOKEN ?? "",
    scanDefaults: {
      aiPrompt: DEFAULT_AI_PROMPT,
      concurrency: DEFAULT_SCAN_CONCURRENCY,
      nearThreshold: 0.9,
      skipAi: false,
      skipExif: false,
    },
  };
}
