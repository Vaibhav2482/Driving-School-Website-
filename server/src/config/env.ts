import dotenv from "dotenv";
import { z } from "zod";

/** Values that mean "someone copied .env.example and forgot to fill this in". */
const PLACEHOLDER_PATTERN = /change-?me|replace-?me|your-secret|<.*>/i;

const secret = (name: string) =>
  z
    .string({ error: `${name} is required` })
    .min(32, `${name} must be at least 32 characters (generate one with: openssl rand -base64 48)`)
    .refine(
      (v) => !PLACEHOLDER_PATTERN.test(v),
      `${name} still contains the .env.example placeholder`,
    );

/** In .env files `KEY=` means "not set": treat empty strings as undefined for optional values. */
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const isValidTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),

    DATABASE_URL: z
      .string({ error: "DATABASE_URL is required" })
      .regex(/^postgres(ql)?:\/\//, "DATABASE_URL must be a postgresql:// connection string"),

    JWT_ACCESS_SECRET: secret("JWT_ACCESS_SECRET"),
    JWT_REFRESH_SECRET: secret("JWT_REFRESH_SECRET"),
    JWT_ACCESS_TTL: z
      .string()
      .regex(/^\d+[smhd]$/, "JWT_ACCESS_TTL must look like 15m, 1h or 7d")
      .default("15m"),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),

    /** Public origin of the web app. Used for CORS and for links in emails. */
    CLIENT_URL: z.url("CLIENT_URL must be a valid URL, e.g. http://localhost:5273").optional(),

    BUSINESS_TIMEZONE: z
      .string()
      .default("Asia/Kolkata")
      .refine(isValidTimeZone, "BUSINESS_TIMEZONE must be a valid IANA time zone"),

    /** Number of reverse-proxy hops in front of the API (0 = none). Needed for correct client IPs. */
    TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
    /** Requests allowed per IP per 15 minutes across the whole API. */
    RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
    /** Enquiry form submissions allowed per IP per hour (public endpoint; abuse protection). */
    ENQUIRY_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(8),

    /** bcrypt cost factor (work factor). Production requires at least 10; tests use a low value for speed. */
    PASSWORD_HASH_COST: z.coerce.number().int().min(4).max(15).default(12),
    /** FAILED login attempts allowed per IP per 15 minutes. Successful logins are not counted. */
    LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
    /** Password-reset and invitation-acceptance requests allowed per IP per hour. */
    PASSWORD_RESET_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(5),
    /**
     * Local development only: when true and no SMTP server is configured, password-reset and invitation
     * links are written to the server log so you can test the flow. Refused in production.
     */
    AUTH_DEV_LOG_LINKS: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),

    // ── Email (SMTP) ─────────────────────────────────────────────────────────────────────────
    SMTP_HOST: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    SMTP_PORT: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(65535).optional()),
    /** Implicit TLS. Defaults to true for port 465 and false otherwise (STARTTLS is used when offered). */
    SMTP_SECURE: z.preprocess(
      blankToUndefined,
      z
        .enum(["true", "false"])
        .optional()
        .transform((value) => (value === undefined ? undefined : value === "true")),
    ),
    SMTP_USER: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    SMTP_PASSWORD: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    /** From header, e.g. "Sri Sai Balaji Driving School <no-reply@example.com>". */
    SMTP_FROM: z.preprocess(blankToUndefined, z.string().min(3).optional()),
    /** Where new-enquiry notifications go. Never guessed: it must be supplied by configuration. */
    OWNER_NOTIFICATION_EMAIL: z.preprocess(
      blankToUndefined,
      z.email("OWNER_NOTIFICATION_EMAIL must be a valid email address").optional(),
    ),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production") {
      if (!env.CLIENT_URL) {
        ctx.addIssue({
          code: "custom",
          path: ["CLIENT_URL"],
          message: "CLIENT_URL is required in production",
        });
      } else if (!env.CLIENT_URL.startsWith("https://")) {
        ctx.addIssue({
          code: "custom",
          path: ["CLIENT_URL"],
          message: "CLIENT_URL must use https in production",
        });
      }
    }
    if (env.NODE_ENV === "production") {
      const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_FROM", "OWNER_NOTIFICATION_EMAIL"] as const;
      for (const key of required) {
        if (env[key] === undefined) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: `${key} is required in production`,
          });
        }
      }
      if (env.PASSWORD_HASH_COST < 10) {
        ctx.addIssue({
          code: "custom",
          path: ["PASSWORD_HASH_COST"],
          message: "PASSWORD_HASH_COST must be at least 10 in production",
        });
      }
      if (env.AUTH_DEV_LOG_LINKS) {
        ctx.addIssue({
          code: "custom",
          path: ["AUTH_DEV_LOG_LINKS"],
          message: "AUTH_DEV_LOG_LINKS must not be enabled in production",
        });
      }
    }
    if ((env.SMTP_USER === undefined) !== (env.SMTP_PASSWORD === undefined)) {
      ctx.addIssue({
        code: "custom",
        path: ["SMTP_PASSWORD"],
        message: "SMTP_USER and SMTP_PASSWORD must be set together (or both left empty)",
      });
    }
    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: "custom",
        path: ["JWT_REFRESH_SECRET"],
        message: "JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET",
      });
    }
  })
  .transform((env) => ({
    ...env,
    isProduction: env.NODE_ENV === "production",
    isTest: env.NODE_ENV === "test",
    /** Normalised origin (no path, no trailing slash) for the CORS allow-list. */
    clientOrigin: new URL(env.CLIENT_URL ?? "http://localhost:5273").origin,
    /** True when an SMTP server is configured (otherwise the log-only development channel is used). */
    smtpConfigured: env.SMTP_HOST !== undefined,
    /** Implicit TLS unless configured otherwise: port 465 uses it, others upgrade with STARTTLS. */
    smtpSecure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
  }));

export type Env = z.output<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Invalid environment configuration:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.name = "EnvValidationError";
  }
}

/**
 * Validate an environment map. Pure function: used by tests and by `loadEnv`.
 * Error messages name the variable but never echo its (possibly secret) value.
 */
export function parseEnv(source: NodeJS.ProcessEnv | Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new EnvValidationError(
      result.error.issues.map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`),
    );
  }
  return result.data;
}

let cached: Env | undefined;

/** Load `.env` (if present) and validate `process.env`. Throws EnvValidationError on failure. */
export function loadEnv(): Env {
  if (!cached) {
    dotenv.config({ quiet: true });
    cached = parseEnv(process.env);
  }
  return cached;
}
