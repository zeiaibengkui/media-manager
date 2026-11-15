import { createServer } from "node:http";
import type { Server } from "node:http";
import type { HealthResponse } from "../shared/api-types.js";
import { handleAlbumRoutes } from "./http/album-routes.js";
import { isAuthorized } from "./http/auth.js";
import { setCorsHeaders } from "./http/cors.js";
import { handleDuplicateRoutes } from "./http/duplicate-routes.js";
import { ApiRequestError } from "./http/errors.js";
import { sendError, sendJson } from "./http/io.js";
import { handleMediaRoutes } from "./http/media-routes.js";
import { handleScanRoutes } from "./http/scan-routes.js";
import { handleSettingsRoutes } from "./http/settings-routes.js";
import { ScanJobManager } from "./jobs.js";

const VERSION = "0.1.0";

export function createMediaServer(): Server {
  const jobs = new ScanJobManager();

  return createServer((request, response) => {
    setCorsHeaders(request, response);
    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    void (async () => {
      const url = new URL(request.url ?? "/", "http://localhost");
      if (request.method === "GET" && url.pathname === "/api/health") {
        const body: HealthResponse = {
          status: "ok",
          service: "media-manager-server",
          version: VERSION,
        };
        sendJson(response, 200, body);
        return;
      }
      if (!isAuthorized(request)) {
        throw new ApiRequestError(401, "UNAUTHORIZED", "Missing or invalid bearer token");
      }

      if (await handleAlbumRoutes(request, response, url)) return;
      if (await handleScanRoutes(request, response, url, jobs)) return;
      if (await handleDuplicateRoutes(request, response, url)) return;
      if (await handleMediaRoutes(request, response, url)) return;
      if (await handleSettingsRoutes(request, response, url)) return;
      throw new ApiRequestError(404, "NOT_FOUND", "API path not found");
    })().catch((error: unknown) => {
      if (error instanceof ApiRequestError) {
        sendError(response, error);
        return;
      }
      console.error("API request failed:", error);
      sendError(response, new ApiRequestError(500, "INTERNAL_ERROR", "Internal server error"));
    });
  });
}
