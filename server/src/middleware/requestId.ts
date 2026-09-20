import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

/** Only accept inbound request IDs that are short and boring, so they are safe to log and echo. */
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{8,64}$/;

/** Assigns every request an ID (from `X-Request-Id` if well-formed, else a new UUID) and echoes it back. */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.headers["x-request-id"];
  const id =
    typeof incoming === "string" && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
};
