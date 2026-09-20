import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError } from "../lib/errors.js";
import { silentLogger } from "../test/helpers.js";
import { errorHandler } from "./errorHandler.js";

function appThatThrows(error: unknown) {
  const app = express();
  app.get("/boom", () => {
    throw error;
  });
  app.use(errorHandler(silentLogger));
  return app;
}

describe("errorHandler", () => {
  it("hides internals of unexpected errors (no message, no stack)", async () => {
    const secretDetail = "connection string postgres://user:hunter2@db/prod exploded";
    const res = await request(appThatThrows(new Error(secretDetail))).get("/boom");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again later." },
    });
    expect(JSON.stringify(res.body)).not.toMatch(/hunter2|postgres|at .*\.ts|stack/i);
  });

  it("passes AppError status, code, message and details through", async () => {
    const res = await request(
      appThatThrows(AppError.conflict("Slot taken.", { field: "startAt" })),
    ).get("/boom");
    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: { code: "CONFLICT", message: "Slot taken.", details: { field: "startAt" } },
    });
  });

  it.each([
    [AppError.unauthenticated(), 401, "UNAUTHENTICATED"],
    [AppError.forbidden(), 403, "FORBIDDEN"],
    [AppError.notFound(), 404, "NOT_FOUND"],
    [AppError.tooManyRequests(), 429, "RATE_LIMITED"],
  ])("maps %s to the right status and code", async (error, status, code) => {
    const res = await request(appThatThrows(error)).get("/boom");
    expect(res.status).toBe(status);
    expect(res.body.error.code).toBe(code);
  });

  it("turns a stray ZodError into a 400 with per-field details", async () => {
    const parsed = z.object({ email: z.email() }).safeParse({ email: "nope" });
    if (parsed.success) throw new Error("expected failure");
    const res = await request(appThatThrows(parsed.error)).get("/boom");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details[0].path).toBe("email");
  });

  it("maps Prisma unique-constraint errors to 409 without leaking column names", async () => {
    const prismaError = Object.assign(
      new Error("Unique constraint failed on the fields: (`email`)"),
      {
        name: "PrismaClientKnownRequestError",
        code: "P2002",
      },
    );
    const res = await request(appThatThrows(prismaError)).get("/boom");
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
    expect(JSON.stringify(res.body)).not.toMatch(/email|Unique constraint/);
  });

  it("maps Prisma record-not-found to 404", async () => {
    const prismaError = Object.assign(new Error("not found"), {
      name: "PrismaClientKnownRequestError",
      code: "P2025",
    });
    const res = await request(appThatThrows(prismaError)).get("/boom");
    expect(res.status).toBe(404);
  });
});
