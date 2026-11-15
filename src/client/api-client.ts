import type {
  ApiErrorBody,
  DuplicatesResponse,
  HealthResponse,
  ScanJob,
  ScanRequest,
} from "../shared/api-types.js";

export class MediaApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export class MediaApiClient {
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly token?: string,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers,
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      throw new MediaApiError(
        0,
        "NETWORK_ERROR",
        `Cannot connect to Media Manager server: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const text = await response.text();
    const body: unknown = text ? JSON.parse(text) as unknown : undefined;

    if (!response.ok) {
      const errorBody = body as ApiErrorBody | undefined;
      throw new MediaApiError(
        response.status,
        errorBody?.error.code ?? "HTTP_ERROR",
        errorBody?.error.message ?? `API request failed: HTTP ${response.status}`,
      );
    }

    return body as T;
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/api/health");
  }

  async startScan(request: ScanRequest): Promise<ScanJob> {
    return this.request<ScanJob>("/api/scans", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getScan(id: string): Promise<ScanJob> {
    return this.request<ScanJob>(`/api/scans/${encodeURIComponent(id)}`);
  }

  async getDuplicates(threshold: number): Promise<DuplicatesResponse> {
    const query = new URLSearchParams({
      threshold: String(threshold),
    });
    return this.request<DuplicatesResponse>(`/api/duplicates?${query.toString()}`);
  }
}
