import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";
import type {
  ScanJob,
  ScanJobListResponse,
} from "../../shared/api-types.js";
import {
  ScanJobActionError,
  ScanJobManager,
} from "../jobs.js";
import { ApiRequestError } from "./errors.js";
import { readJsonBody, sendJson } from "./io.js";
import { parseScanRequest } from "./scan-request.js";

export async function handleScanRoutes(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
  jobs: ScanJobManager,
): Promise<boolean> {
  if (request.method === "POST" && url.pathname === "/api/scans") {
    const job = await jobs.start(parseScanRequest(await readJsonBody(request)));
    response.setHeader("Location", `/api/scans/${job.id}`);
    sendJson(response, 202, job);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/scans") {
    const jobsList = (await jobs.list()).map(({ events: _events, ...summary }) => summary);
    const body: ScanJobListResponse = {
      count: jobsList.length,
      items: jobsList,
    };
    sendJson(response, 200, body);
    return true;
  }

  const actionMatch = /^\/api\/scans\/([^/]+)\/(stop|retry)$/.exec(url.pathname);
  if (request.method === "POST" && actionMatch?.[1] && actionMatch[2]) {
    const id = decodeURIComponent(actionMatch[1]);
    try {
      const job = actionMatch[2] === "stop"
        ? await jobs.stop(id)
        : await jobs.retry(id);
      sendJson(response, 200, job);
    } catch (error) {
      if (error instanceof ScanJobActionError) {
        throw new ApiRequestError(error.status, error.code, error.message);
      }
      throw error;
    }
    return true;
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/scans/")) {
    const id = decodeURIComponent(url.pathname.slice("/api/scans/".length));
    const job = await jobs.get(id);
    if (!job) {
      throw new ApiRequestError(404, "SCAN_NOT_FOUND", "Scan job not found");
    }
    const body: ScanJob = job;
    sendJson(response, 200, body);
    return true;
  }

  return false;
}
