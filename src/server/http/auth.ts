import type { IncomingMessage } from "node:http";

export function isAuthorized(request: IncomingMessage): boolean {
  const token = process.env.MEDIA_MANAGER_API_TOKEN;
  if (!token) {
    return true;
  }
  return request.headers.authorization === `Bearer ${token}`;
}
