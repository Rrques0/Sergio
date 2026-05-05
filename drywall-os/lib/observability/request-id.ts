import { randomUUID } from "node:crypto";

export function getRequestId(headers?: Headers) {
  return headers?.get("x-request-id") ?? randomUUID();
}
