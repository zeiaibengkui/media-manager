export interface ScanRequest {
  path: string; skipAi: boolean; skipExif: boolean; nearThreshold: number;
  concurrency: number;
  aiPrompt: string;
}

export const DEFAULT_SCAN_CONCURRENCY = 4;
export const MAX_SCAN_CONCURRENCY = 20;
export const DEFAULT_AI_PROMPT =
  "请用中文简洁描述图片的主体、场景和关键信息，约30个字。";

export interface PersistedSettings {
  aiPrompt: string; concurrency: number; nearThreshold: number;
  skipAi: boolean; skipExif: boolean;
}

export interface ScanEvent { type: "info" | "warning"; message: string }

export interface ScanSummary {
  scanned: number; created: number; exactDuplicates: number;
  nearDuplicateMatches: number; failed: number;
}

export type ScanJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "stopped";

export interface ScanJobSummary {
  id: string; status: ScanJobStatus; request: ScanRequest;
  summary: ScanSummary | null; error: string | null; retryOf: string | null;
  createdAt: string; updatedAt: string;
}

export interface ScanJob extends ScanJobSummary { events: ScanEvent[] }

export interface ScanJobListResponse {
  count: number;
  items: ScanJobSummary[];
}

export interface MediaReference {
  fileHash: string;
  filePath: string;
  fileName: string;
}

export interface MediaPathRecord {
  id: string;
  filePath: string;
  fileName: string;
}

export interface AlbumReference { id: string; name: string }

export interface AlbumRecord extends AlbumReference {
  itemCount: number;
  coverFileHash: string | null;
  coverFileName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlbumListResponse {
  count: number;
  items: AlbumRecord[];
}

export interface CreateAlbumRequest { name: string }

export interface DuplicatePair {
  left: MediaReference; right: MediaReference; similarity: number;
  dhashSimilarity: number | null; phashSimilarity: number | null;
}

export interface DuplicatesResponse {
  threshold: number; count: number; hasMore: boolean;
  candidates: DuplicatePair[];
}

export const DUPLICATE_BATCH_LIMIT = 49;

export interface MediaRecord {
  fileHash: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: string;
  width: number;
  height: number;
  dhash64: string | null;
  phash64: string | null;
  title: string | null;
  description: string | null;
  category: string | null;
  favorite: boolean;
  tags: string[];
  albums: AlbumReference[];
  exif: unknown;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
  paths: MediaPathRecord[];
}

export interface MediaPatchRequest {
  fileName?: string;
  favorite?: boolean;
  category?: string | null;
  tags?: string[];
}

export interface ResolveDuplicateRequest {
  leftHash: string;
  rightHash: string;
  action: "keep-both" | "remove-one";
  removeHash?: string;
  removeFilePath?: string;
}

export interface ResolveDuplicateResponse {
  decision: "keep-both" | "removed";
  deletedPath: string | null;
  mediaDeleted: boolean;
  remainingPaths: number;
}

export interface MediaListResponse {
  count: number;
  items: MediaRecord[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface HealthResponse {
  status: "ok";
  service: "media-manager-server";
  version: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}
