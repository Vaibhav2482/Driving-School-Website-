import type { Express } from "express";
import type { Logger } from "pino";
import request from "supertest";
import { createApp } from "../app.js";
import type { Env } from "../config/env.js";
import type { EmailMessage, EmailProvider } from "../integrations/email/email-provider.js";
import type { Role } from "../generated/prisma/enums.js";
import { createPasswordHasher } from "../lib/passwords.js";
import { createNotificationService } from "../modules/notifications/notification.service.js";
import { createServices, type AppServices } from "../services.js";
import { FakeDb } from "./fakePrisma.js";
import { silentLogger, testEnv } from "./helpers.js";

export const DEFAULT_PASSWORD = "Correct-horse-battery-9";

export interface HarnessOptions {
  env?: Record<string, string | undefined>;
  logger?: Logger;
  /** Whether the fake mail provider claims to deliver real mail (affects the non-production guard). */
  deliversMail?: boolean;
}

/** A controllable clock: tests move time forward instead of sleeping. */
export function createClock(start = new Date("2026-09-20T05:00:00.000Z")) {
  const clock = {
    time: start,
    now: () => new Date(clock.time),
    advance: (ms: number) => {
      clock.time = new Date(clock.time.getTime() + ms);
    },
  };
  return clock;
}

/**
 * A complete test application: real Express app, real services and security logic, in-memory database,
 * a recording email provider and a manual background scheduler. Nothing here touches the network.
 */
export function createAuthHarness(options: HarnessOptions = {}) {
  const env: Env = testEnv({
    PASSWORD_HASH_COST: "4",
    OWNER_NOTIFICATION_EMAIL: "owner@example.test",
    // High by default so unrelated tests never trip a limiter; limiter tests override it.
    LOGIN_RATE_LIMIT_MAX: "100",
    PASSWORD_RESET_RATE_LIMIT_MAX: "100",
    ...options.env,
  });
  const logger = options.logger ?? silentLogger;
  const db = new FakeDb();
  const clock = createClock();
  const hasher = createPasswordHasher(4);

  const sent: EmailMessage[] = [];
  const mail = { fail: false, failWith: "SMTP connection refused" };
  const emailProvider: EmailProvider = {
    name: "smtp",
    deliversMail: options.deliversMail ?? false,
    send(message) {
      if (mail.fail) return Promise.reject(new Error(mail.failWith));
      sent.push(message);
      return Promise.resolve();
    },
  };

  const scheduled: (() => Promise<unknown>)[] = [];
  const notifications = createNotificationService({
    prisma: db.asPrisma(),
    logger,
    env,
    emailProvider,
    clock: clock.now,
    schedule: (job) => scheduled.push(job),
  });

  const services: AppServices = createServices(
    { env, logger, prisma: db.asPrisma() },
    { clock: clock.now, hasher, emailProvider, notifications },
  );
  const app: Express = createApp({ env, logger, prisma: db.asPrisma(), services });

  /** Run everything the app queued to happen "in the background" (e.g. sending emails). */
  async function flush() {
    while (scheduled.length > 0) await scheduled.shift()!();
  }

  async function createUser(input: {
    role: Role;
    email?: string | null;
    phone?: string | null;
    fullName?: string;
    password?: string;
    isActive?: boolean;
    mustChangePassword?: boolean;
    profile?: "student" | "instructor";
    branchId?: string;
  }) {
    const user = (await db.user.create({
      data: {
        role: input.role,
        email:
          input.email === undefined
            ? `${input.role.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}@example.test`
            : input.email,
        phone: input.phone ?? null,
        fullName: input.fullName ?? `Test ${input.role}`,
        passwordHash: await hasher.hash(input.password ?? DEFAULT_PASSWORD),
        isActive: input.isActive ?? true,
        mustChangePassword: input.mustChangePassword ?? false,
      },
    })) as { id: string; email: string | null; phone: string | null };

    let profileId: string | null = null;
    if (input.profile) {
      const branchId = input.branchId ?? ((await ensureBranch()).id as string);
      const profile = (await (input.profile === "student" ? db.student : db.instructor).create({
        data: { userId: user.id, branchId },
      })) as { id: string };
      profileId = profile.id;
    }
    return { ...user, profileId };
  }

  async function ensureBranch() {
    const existing = await db.branch.findFirst({ where: { slug: "kondapur" } });
    return existing ?? (await db.branch.create({ data: { name: "Kondapur", slug: "kondapur" } }));
  }

  /** Requests the way the web app makes them: with the custom client header. */
  const api = {
    get: (path: string) => request(app).get(`/api/v1${path}`).set("X-SSB-Client", "web"),
    post: (path: string) => request(app).post(`/api/v1${path}`).set("X-SSB-Client", "web"),
    raw: () => request(app),
  };

  const cookieName = "ssb_refresh";

  /** All Set-Cookie header values on a response. */
  function setCookies(res: request.Response): string[] {
    const header = res.headers["set-cookie"] as unknown as string[] | string | undefined;
    return Array.isArray(header) ? header : header ? [header] : [];
  }

  /** The refresh cookie the server set on this response, as a `name=value` string ready to send back. */
  function refreshCookieOf(res: request.Response): string | undefined {
    return setCookies(res)
      .find((c) => c.startsWith(`${cookieName}=`))
      ?.split(";")[0];
  }

  async function login(identifier: string, password = DEFAULT_PASSWORD) {
    const res = await api.post("/auth/login").send({ identifier, password });
    const body = res.body as {
      data?: { accessToken?: string; user?: { id: string; role: Role } };
    } | null;
    return {
      res,
      accessToken: body?.data?.accessToken ?? "",
      cookie: refreshCookieOf(res) ?? "",
      user: body?.data?.user,
    };
  }

  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  return {
    app,
    env,
    db,
    clock,
    hasher,
    sent,
    mail,
    notifications,
    services,
    scheduled,
    flush,
    createUser,
    ensureBranch,
    api,
    login,
    refreshCookieOf,
    setCookies,
    cookieName,
    bearer,
    logger,
  };
}

export type AuthHarness = ReturnType<typeof createAuthHarness>;
