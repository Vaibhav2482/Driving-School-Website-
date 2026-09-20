import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { checkPasswordPolicy, createPasswordHasher, PASSWORD_MAX_BYTES } from "./passwords.js";
import {
  generateOpaqueToken,
  hashToken,
  parseDurationSeconds,
  signAccessToken,
  verifyAccessToken,
} from "./tokens.js";
import { sanitizeAuditData } from "./audit.js";
import { parseEnv, type EnvValidationError } from "../config/env.js";
import { TEST_ENV_SOURCE } from "../test/helpers.js";

const SECRETS = {
  JWT_ACCESS_SECRET: "test-access-secret-0123456789-abcdefghijklmnop",
  JWT_ACCESS_TTL: "15m",
};
const CLAIMS = {
  sub: "0199e6c0-0000-4000-8000-000000000001",
  role: "OWNER" as const,
  sid: "0199e6c0-0000-4000-8000-000000000002",
};
const NOW = new Date("2026-09-20T05:00:00Z");

describe("password hashing", () => {
  const hasher = createPasswordHasher(4);

  it("hashes with bcrypt, salts every hash, and verifies", async () => {
    const a = await hasher.hash("Correct-horse-9");
    const b = await hasher.hash("Correct-horse-9");
    expect(a).toMatch(/^\$2[aby]\$04\$/);
    expect(a).not.toBe(b); // unique salts
    expect(await hasher.verify("Correct-horse-9", a)).toBe(true);
    expect(await hasher.verify("correct-horse-9", a)).toBe(false);
  });

  it("treats a malformed stored hash as a failed login, never as success or a crash", async () => {
    expect(await hasher.verify("anything", "not-a-hash")).toBe(false);
    expect(await hasher.verify("anything", "")).toBe(false);
  });

  it("can spend verification time for a non-existent account", async () => {
    await expect(hasher.verifyAgainstDummy("whatever")).resolves.toBeUndefined();
  });
});

describe("password policy", () => {
  it.each(["Correct-horse-battery-9", "a long passphrase with spaces", "Tr0ub4dor&3xyz"])(
    "accepts %j",
    (password) => {
      expect(checkPasswordPolicy(password)).toEqual([]);
    },
  );

  it("counts BYTES against bcrypt's 72-byte limit, so multibyte passwords are not silently truncated", () => {
    expect(checkPasswordPolicy("éa".repeat(25))).toHaveLength(1); // 50 characters but 75 bytes
    expect(checkPasswordPolicy("éa".repeat(24))).toEqual([]); // 48 characters, exactly 72 bytes
    expect(PASSWORD_MAX_BYTES).toBe(72);
  });

  it("rejects the account's own phone number, in any format", () => {
    expect(checkPasswordPolicy("9666146913", { phone: "+919666146913" }).length).toBeGreaterThan(0);
  });
});

describe("opaque tokens", () => {
  it("are 256 bits of URL-safe randomness, all different", () => {
    const tokens = new Set(Array.from({ length: 50 }, generateOpaqueToken));
    expect(tokens.size).toBe(50);
    for (const t of tokens) expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("are stored as a SHA-256 hash that cannot be turned back into the token", () => {
    const token = generateOpaqueToken();
    const hash = hashToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
    expect(hashToken(token)).toBe(hash);
  });
});

describe("access tokens (JWT)", () => {
  it("round-trip with the right claims, expiring after the configured time", () => {
    const { token, expiresInSeconds } = signAccessToken(SECRETS, CLAIMS, NOW);
    expect(expiresInSeconds).toBe(900);
    expect(verifyAccessToken(SECRETS, token, NOW)).toEqual(CLAIMS);
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    expect(decoded.exp! - decoded.iat!).toBe(900);
    expect(decoded.iss).toBe("sri-sai-balaji-api");
    expect(JSON.stringify(decoded)).not.toMatch(/email|password|name/i); // no personal data in the token
  });

  it("are rejected at and after expiry with TOKEN_EXPIRED", () => {
    const { token } = signAccessToken(SECRETS, CLAIMS, NOW);
    expect(() =>
      verifyAccessToken(SECRETS, token, new Date(NOW.getTime() + 899_000)),
    ).not.toThrow();
    expect(() => verifyAccessToken(SECRETS, token, new Date(NOW.getTime() + 901_000))).toThrowError(
      expect.objectContaining({ code: "TOKEN_EXPIRED" }),
    );
  });

  it("are rejected with a tampered payload, another secret, or a missing/invalid claim", () => {
    const { token } = signAccessToken(SECRETS, CLAIMS, NOW);
    const [h, , s] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ ...(jwt.decode(token) as object), role: "SUPER_ADMIN" }),
    ).toString("base64url");
    expect(() => verifyAccessToken(SECRETS, `${h}.${forgedPayload}.${s}`, NOW)).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED" }),
    );
    expect(() =>
      verifyAccessToken(
        { JWT_ACCESS_SECRET: "another-secret-another-secret-another-000" },
        token,
        NOW,
      ),
    ).toThrow();
    const noSid = jwt.sign(
      { sub: CLAIMS.sub, role: "OWNER", iat: 1, exp: 4_000_000_000 },
      SECRETS.JWT_ACCESS_SECRET,
      { issuer: "sri-sai-balaji-api", audience: "sri-sai-balaji-web" },
    );
    expect(() => verifyAccessToken(SECRETS, noSid, NOW)).toThrow();
  });

  it("only accept HS256 (an RS256 or none-signed token is refused)", () => {
    const none = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from(JSON.stringify({ ...CLAIMS, iss: "sri-sai-balaji-api", aud: "sri-sai-balaji-web", exp: 4_000_000_000 })).toString("base64url")}.`;
    expect(() => verifyAccessToken(SECRETS, none, NOW)).toThrow();
    const hs512 = jwt.sign({ ...CLAIMS, iat: 1, exp: 4_000_000_000 }, SECRETS.JWT_ACCESS_SECRET, {
      algorithm: "HS512",
      issuer: "sri-sai-balaji-api",
      audience: "sri-sai-balaji-web",
    });
    expect(() => verifyAccessToken(SECRETS, hs512, NOW)).toThrow();
  });

  it("parses durations", () => {
    expect(parseDurationSeconds("30s")).toBe(30);
    expect(parseDurationSeconds("15m")).toBe(900);
    expect(parseDurationSeconds("2h")).toBe(7200);
    expect(parseDurationSeconds("7d")).toBe(604_800);
    expect(() => parseDurationSeconds("soon")).toThrow();
  });
});

describe("audit data", () => {
  it("strips anything that looks like a credential, however it got there", () => {
    const clean = sanitizeAuditData({
      reason: "bad_password",
      password: "hunter2",
      refreshToken: "abc",
      authorization: "Bearer x",
      passwordHash: "$2b$",
      note: "ok",
    });
    expect(clean).toEqual({ reason: "bad_password", note: "ok" });
  });
});

describe("environment rules for auth and email", () => {
  const production = {
    ...TEST_ENV_SOURCE,
    NODE_ENV: "production",
    CLIENT_URL: "https://www.example.org",
    PASSWORD_HASH_COST: "12",
    SMTP_HOST: "smtp.example.org",
    SMTP_PORT: "587",
    SMTP_FROM: "Sri Sai Balaji <no-reply@example.org>",
    OWNER_NOTIFICATION_EMAIL: "owner@example.org",
  };
  const problems = (source: Record<string, string | undefined>) => {
    try {
      parseEnv(source);
      return [];
    } catch (err) {
      return (err as EnvValidationError).problems;
    }
  };

  it("accepts a complete production configuration", () => {
    expect(problems(production)).toEqual([]);
  });

  it.each(["SMTP_HOST", "SMTP_PORT", "SMTP_FROM", "OWNER_NOTIFICATION_EMAIL"])(
    "production requires %s",
    (key) => {
      expect(problems({ ...production, [key]: undefined }).join("\n")).toContain(
        `${key} is required in production`,
      );
    },
  );

  it("production requires a strong bcrypt cost and forbids dev link logging", () => {
    expect(problems({ ...production, PASSWORD_HASH_COST: "4" }).join("\n")).toMatch(/at least 10/);
    expect(problems({ ...production, AUTH_DEV_LOG_LINKS: "true" }).join("\n")).toMatch(
      /must not be enabled in production/,
    );
  });

  it("development needs none of the email settings", () => {
    const env = parseEnv({ ...TEST_ENV_SOURCE, NODE_ENV: "development" });
    expect(env.smtpConfigured).toBe(false);
    expect(env.OWNER_NOTIFICATION_EMAIL).toBeUndefined();
    expect(env.AUTH_DEV_LOG_LINKS).toBe(false);
  });

  it("treats empty values from a .env file as 'not set'", () => {
    const env = parseEnv({
      ...TEST_ENV_SOURCE,
      SMTP_HOST: "",
      SMTP_PORT: "",
      OWNER_NOTIFICATION_EMAIL: "",
      SMTP_USER: "",
      SMTP_PASSWORD: "",
    });
    expect(env.smtpConfigured).toBe(false);
  });

  it("requires SMTP_USER and SMTP_PASSWORD together and a valid owner address", () => {
    expect(problems({ ...TEST_ENV_SOURCE, SMTP_USER: "u" }).join("\n")).toMatch(/set together/);
    expect(
      problems({ ...TEST_ENV_SOURCE, OWNER_NOTIFICATION_EMAIL: "not-an-email" }).join("\n"),
    ).toMatch(/OWNER_NOTIFICATION_EMAIL/);
  });

  it("uses implicit TLS on port 465 by default", () => {
    expect(parseEnv({ ...TEST_ENV_SOURCE, SMTP_HOST: "h", SMTP_PORT: "465" }).smtpSecure).toBe(
      true,
    );
    expect(parseEnv({ ...TEST_ENV_SOURCE, SMTP_HOST: "h", SMTP_PORT: "587" }).smtpSecure).toBe(
      false,
    );
  });

  it("never echoes secret values in errors", () => {
    expect(
      problems({ ...production, SMTP_USER: "user", SMTP_PASSWORD: undefined }).join("\n"),
    ).not.toContain("user");
  });
});
