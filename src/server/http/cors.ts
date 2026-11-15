import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";

const DEFAULT_WEB_ORIGINS = [
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
];

function configuredWebOrigins(): Set<string> {
  const configured = process.env.MEDIA_MANAGER_WEB_ORIGIN
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_WEB_ORIGINS, ...(configured ?? [])]);
}

export function setCorsHeaders(
  request: IncomingMessage,
  response: ServerResponse,
): void {
  const origin = request.headers.origin;
  if (!origin || !configuredWebOrigins().has(origin)) {
    return;
  }

  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  response.setHeader("Vary", "Origin");
}
