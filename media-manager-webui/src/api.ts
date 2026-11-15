import type {
  AlbumListResponse,
  AlbumRecord,
  DuplicatesResponse,
  MediaListResponse,
  MediaPatchRequest,
  MediaRecord,
  ResolveDuplicateRequest,
  ResolveDuplicateResponse,
  ScanJob,
  ScanJobListResponse,
  ScanRequest,
} from "../../src/shared/api-types.js";
import { ApiError, MediaCore } from "./api-core.js";

export { ApiError, MediaCore };
export type { ApiSettings } from "./api-core.js";

export interface MediaQuery {
  favoriteOnly?: boolean;
  albumId?: string;
}

export class MediaApi extends MediaCore {
  async media(limit = 500, cursor?: string, filters: MediaQuery = {}): Promise<MediaListResponse> {
    const query = new URLSearchParams({ limit: String(limit) });
    if (cursor) query.set("cursor", cursor);
    if (filters.favoriteOnly) query.set("favorite", "true");
    if (filters.albumId) query.set("albumId", filters.albumId);
    return this.request<MediaListResponse>(`/api/media?${query.toString()}`);
  }

  async mediaRecord(fileHash: string): Promise<MediaRecord> {
    return this.request<MediaRecord>(`/api/media/${encodeURIComponent(fileHash)}`);
  }

  async duplicates(threshold: number): Promise<DuplicatesResponse> {
    return this.request<DuplicatesResponse>(`/api/duplicates?threshold=${threshold}`);
  }

  async startScan(request: ScanRequest): Promise<ScanJob> {
    return this.request<ScanJob>("/api/scans", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async scanJob(id: string): Promise<ScanJob> {
    return this.request<ScanJob>(`/api/scans/${encodeURIComponent(id)}`);
  }

  async scanJobs(): Promise<ScanJobListResponse> {
    return this.request<ScanJobListResponse>("/api/scans");
  }

  async stopScan(id: string): Promise<ScanJob> {
    return this.request<ScanJob>(`/api/scans/${encodeURIComponent(id)}/stop`, {
      method: "POST",
    });
  }

  async retryScan(id: string): Promise<ScanJob> {
    return this.request<ScanJob>(`/api/scans/${encodeURIComponent(id)}/retry`, {
      method: "POST",
    });
  }

  async renameMedia(fileHash: string, fileName: string): Promise<MediaRecord> {
    return this.updateMedia(fileHash, { fileName });
  }

  async updateMedia(fileHash: string, patch: MediaPatchRequest): Promise<MediaRecord> {
    return this.request<MediaRecord>(`/api/media/${encodeURIComponent(fileHash)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  }

  async albums(): Promise<AlbumListResponse> {
    return this.request<AlbumListResponse>("/api/albums");
  }

  async createAlbum(name: string): Promise<AlbumRecord> {
    return this.request<AlbumRecord>("/api/albums", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async addToAlbum(albumId: string, fileHash: string): Promise<MediaRecord> {
    return this.request<MediaRecord>(
      `/api/albums/${encodeURIComponent(albumId)}/media/${encodeURIComponent(fileHash)}`,
      { method: "POST" },
    );
  }

  async removeFromAlbum(albumId: string, fileHash: string): Promise<MediaRecord> {
    return this.request<MediaRecord>(
      `/api/albums/${encodeURIComponent(albumId)}/media/${encodeURIComponent(fileHash)}`,
      { method: "DELETE" },
    );
  }

  async resolveDuplicate(
    request: ResolveDuplicateRequest,
  ): Promise<ResolveDuplicateResponse> {
    return this.request<ResolveDuplicateResponse>("/api/duplicates/decisions", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async mediaBlob(fileHash: string): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/api/media/${encodeURIComponent(fileHash)}/content`,
      {
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined,
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!response.ok) {
      throw new ApiError(response.status, "MEDIA_CONTENT_ERROR", "Unable to load media");
    }
    return response.blob();
  }
}
