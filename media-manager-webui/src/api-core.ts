import type {
  ApiErrorBody,
  HealthResponse,
  PersistedSettings,
} from "../../src/shared/api-types.js";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface ApiSettings {
  apiUrl: string;
  token: string;
}

export class MediaCore {
  protected readonly baseUrl: string;

  constructor(
    apiUrl: string,
    protected readonly token = "",
  ) {
    this.baseUrl = apiUrl.replace(/\/+$/, "");
  }

  protected headers(includeJson = false): Headers {
    const headers = new Headers({ Accept: "application/json" });
    if (includeJson) headers.set("Content-Type", "application/json");
    if (this.token) headers.set("Authorization", `Bearer ${this.token}`);
    return headers;
  }

  protected async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: this.headers(init.body !== undefined),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      throw new ApiError(0, "NETWORK_ERROR", error instanceof Error ? error.message : "Network error");
    }

    const text = await response.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) as unknown : undefined;
    } catch {
      throw new ApiError(response.status, "INVALID_RESPONSE", "Invalid JSON response");
    }
    if (!response.ok) {
      const errorBody = body as ApiErrorBody | undefined;
      throw new ApiError(
        response.status,
        errorBody?.error.code ?? "HTTP_ERROR",
        errorBody?.error.message ?? `Request failed with HTTP ${response.status}`,
      );
    }
    return body as T;
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/api/health");
  }

  async settings(): Promise<PersistedSettings> {
    return this.request<PersistedSettings>("/api/settings");
  }

  async saveSettings(settings: PersistedSettings): Promise<PersistedSettings> {
    return this.request<PersistedSettings>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }
}
