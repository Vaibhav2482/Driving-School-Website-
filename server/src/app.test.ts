import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp, stubPrisma, testEnv } from "./test/helpers.js";

describe("GET /api/v1/health", () => {
  it("returns { data: { status: 'ok' } }", async () => {
    const res = await request(createTestApp()).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: "ok" } });
  });

  it("does not touch the database (liveness only)", async () => {
    const prisma = stubPrisma(() => Promise.reject(new Error("db is down")));
    const res = await request(createTestApp({ prisma })).get("/api/v1/health");
    expect(res.status).toBe(200);
  });

  it("does not leak configuration or secrets", async () => {
    const res = await request(createTestApp()).get("/api/v1/health");
    const text = JSON.stringify(res.body) + JSON.stringify(res.headers);
    expect(text).not.toMatch(/postgres|secret|JWT|password/i);
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("GET /api/v1/health/ready", () => {
  it("reports ok when the database answers", async () => {
    const res = await request(createTestApp()).get("/api/v1/health/ready");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: "ok", database: "up" } });
  });

  it("returns 503 in the standard error envelope when the database is unreachable", async () => {
    const prisma = stubPrisma(() =>
      Promise.reject(new Error("connect ECONNREFUSED 127.0.0.1:5432")),
    );
    const res = await request(createTestApp({ prisma })).get("/api/v1/health/ready");
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED|5432/);
  });
});

describe("request IDs", () => {
  it("generates a request id and echoes it", async () => {
    const res = await request(createTestApp()).get("/api/v1/health");
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("reuses a well-formed inbound id and replaces a malicious one", async () => {
    const app = createTestApp();
    const good = await request(app).get("/api/v1/health").set("X-Request-Id", "client-req-12345");
    expect(good.headers["x-request-id"]).toBe("client-req-12345");

    const bad = await request(app)
      .get("/api/v1/health")
      .set("X-Request-Id", "bad id with spaces\t<script>");
    expect(bad.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("error envelope", () => {
  it("returns a JSON 404 for unknown routes", async () => {
    const res = await request(createTestApp()).get("/api/v1/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toMatch(/GET \/api\/v1\/nope/);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await request(createTestApp())
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send('{"broken":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("returns 413 for oversized bodies", async () => {
    const res = await request(createTestApp())
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ blob: "x".repeat(200_000) }));
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });
});

describe("security headers and CORS", () => {
  it("sets Helmet headers", async () => {
    const res = await request(createTestApp()).get("/api/v1/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["strict-transport-security"]).toBeDefined();
  });

  it("allows the configured client origin only", async () => {
    const app = createTestApp({ env: testEnv({ CLIENT_URL: "https://app.example.com" }) });
    const allowed = await request(app)
      .get("/api/v1/health")
      .set("Origin", "https://app.example.com");
    expect(allowed.headers["access-control-allow-origin"]).toBe("https://app.example.com");
    expect(allowed.headers["access-control-allow-credentials"]).toBe("true");

    const denied = await request(app)
      .get("/api/v1/health")
      .set("Origin", "https://evil.example.org");
    expect(denied.headers["access-control-allow-origin"]).not.toBe("https://evil.example.org");
  });
});

describe("global rate limit", () => {
  it("returns 429 in the standard envelope once the limit is exceeded", async () => {
    const app = createTestApp({ env: testEnv({ RATE_LIMIT_MAX: "2" }) });
    await request(app).get("/api/v1/health");
    await request(app).get("/api/v1/health");
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("RATE_LIMITED");
  });
});
