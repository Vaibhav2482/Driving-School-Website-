import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { httpLogger } from "../middleware/httpLogger.js";
import { requestId } from "../middleware/requestId.js";
import { capturingLogger } from "../test/helpers.js";

describe("log redaction", () => {
  it("redacts credentials even when a whole request-like object is logged", () => {
    const { logger, lines } = capturingLogger();
    logger.info(
      {
        req: {
          headers: {
            authorization: "Bearer abc.def.ghi",
            cookie: "refresh=secretcookie",
            accept: "json",
          },
        },
        res: { headers: { "set-cookie": ["refresh=newsecret"] } },
        user: { email: "a@b.test", password: "hunter2", refreshToken: "rt-123" },
        password: "top-level-password",
        token: "top-level-token",
      },
      "sample",
    );
    const text = JSON.stringify(lines[0]);
    for (const secret of [
      "abc.def.ghi",
      "secretcookie",
      "newsecret",
      "hunter2",
      "rt-123",
      "top-level",
    ]) {
      expect(text).not.toContain(secret);
    }
    expect(text).toContain("[REDACTED]");
    expect(text).toContain("a@b.test"); // non-secret data is untouched
  });
});

describe("http request logging", () => {
  it("logs method, path and request id but never headers or the query string", async () => {
    const { logger, lines } = capturingLogger();
    const app = express();
    app.use(requestId);
    app.use(httpLogger(logger));
    app.get("/api/v1/reset", (_req, res) => {
      res.json({ ok: true });
    });

    await request(app)
      .get("/api/v1/reset?token=super-secret-reset-token")
      .set("Authorization", "Bearer very-secret-jwt")
      .set("Cookie", "refresh=very-secret-cookie");

    const text = JSON.stringify(lines);
    expect(text).toContain("/api/v1/reset");
    expect(text).not.toMatch(/super-secret-reset-token|very-secret-jwt|very-secret-cookie/);
    const entry = lines.find((l) => l.req !== undefined) as {
      req: { method: string; path: string; id: string };
    };
    expect(entry.req.method).toBe("GET");
    expect(entry.req.path).toBe("/api/v1/reset");
    expect(entry.req.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
