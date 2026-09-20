import { describe, expect, it } from "vitest";
import { EnvValidationError, parseEnv } from "./env.js";
import { TEST_ENV_SOURCE } from "../test/helpers.js";

const valid = (overrides: Record<string, string | undefined> = {}) => ({
  ...TEST_ENV_SOURCE,
  ...overrides,
});

const problemsFor = (source: Record<string, string | undefined>): string[] => {
  try {
    parseEnv(source);
  } catch (err) {
    if (err instanceof EnvValidationError) return err.problems;
    throw err;
  }
  return [];
};

describe("parseEnv", () => {
  it("accepts a valid environment and applies safe defaults", () => {
    const env = parseEnv(valid({ PORT: undefined, BUSINESS_TIMEZONE: undefined }));
    expect(env.PORT).toBe(4000);
    expect(env.BUSINESS_TIMEZONE).toBe("Asia/Kolkata");
    expect(env.JWT_ACCESS_TTL).toBe("15m");
    expect(env.TRUST_PROXY).toBe(0);
    expect(env.isProduction).toBe(false);
  });

  it("normalises CLIENT_URL to an origin for the CORS allow-list", () => {
    expect(parseEnv(valid({ CLIENT_URL: "http://localhost:5173/some/path/" })).clientOrigin).toBe(
      "http://localhost:5173",
    );
  });

  it("fails fast when DATABASE_URL is missing", () => {
    expect(problemsFor(valid({ DATABASE_URL: undefined })).join("\n")).toMatch(/DATABASE_URL/);
  });

  it("rejects a non-PostgreSQL DATABASE_URL", () => {
    expect(problemsFor(valid({ DATABASE_URL: "mysql://x" })).join("\n")).toMatch(/postgresql/);
  });

  it("rejects JWT secrets shorter than 32 characters", () => {
    expect(problemsFor(valid({ JWT_ACCESS_SECRET: "too-short" })).join("\n")).toMatch(
      /JWT_ACCESS_SECRET/,
    );
  });

  it("rejects .env.example placeholder secrets", () => {
    const problems = problemsFor(
      valid({ JWT_REFRESH_SECRET: "change-me-change-me-change-me-change-me" }),
    );
    expect(problems.join("\n")).toMatch(/placeholder/);
  });

  it("requires the two JWT secrets to differ", () => {
    const same = "s".repeat(40);
    expect(
      problemsFor(valid({ JWT_ACCESS_SECRET: same, JWT_REFRESH_SECRET: same })).join("\n"),
    ).toMatch(/must differ/);
  });

  it("rejects an invalid time zone", () => {
    expect(problemsFor(valid({ BUSINESS_TIMEZONE: "Mars/Olympus" })).join("\n")).toMatch(
      /BUSINESS_TIMEZONE/,
    );
  });

  it("requires CLIENT_URL over https in production", () => {
    expect(
      problemsFor(valid({ NODE_ENV: "production", CLIENT_URL: undefined })).join("\n"),
    ).toMatch(/CLIENT_URL is required in production/);
    expect(
      problemsFor(valid({ NODE_ENV: "production", CLIENT_URL: "http://example.com" })).join("\n"),
    ).toMatch(/https/);
    expect(
      problemsFor(
        valid({
          NODE_ENV: "production",
          CLIENT_URL: "https://example.com",
          PASSWORD_HASH_COST: "12",
          SMTP_HOST: "smtp.example.com",
          SMTP_PORT: "587",
          SMTP_FROM: "No Reply <no-reply@example.com>",
          OWNER_NOTIFICATION_EMAIL: "owner@example.com",
        }),
      ),
    ).toEqual([]);
  });

  it("never echoes secret values in error messages", () => {
    const leaked = "super-secret-value-that-is-too-short";
    const problems = problemsFor(valid({ JWT_ACCESS_SECRET: "short-secret-xyz" }));
    expect(problems.join("\n")).not.toContain("short-secret-xyz");
    expect(problems.join("\n")).not.toContain(leaked);
  });
});
