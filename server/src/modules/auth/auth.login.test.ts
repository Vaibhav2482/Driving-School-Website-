import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { MAX_FAILED_LOGINS, LOCK_MS } from "./auth.service.js";
import { createAuthHarness, DEFAULT_PASSWORD } from "../../test/authHarness.js";
import { capturingLogger, testEnv } from "../../test/helpers.js";

describe("POST /auth/login: success", () => {
  it("returns a short-lived access token and safe user info, and sets the refresh token only as a cookie", async () => {
    const h = createAuthHarness();
    const user = await h.createUser({
      role: "OWNER",
      email: "owner@example.test",
      fullName: "P. Mahesh",
    });

    const res = await h.api
      .post("/auth/login")
      .send({ identifier: "  Owner@Example.test ", password: DEFAULT_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toEqual({
      id: user.id,
      role: "OWNER",
      name: "P. Mahesh",
      email: "owner@example.test",
      phone: null,
      mustChangePassword: false,
      permissions: expect.arrayContaining(["area:admin", "user:create"]),
    });
    expect(res.body.data.accessToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(res.body.data.expiresIn).toBe(900); // 15 minutes

    const cookie = h.refreshCookieOf(res)!;
    const refreshToken = cookie.split("=")[1]!;
    const body = JSON.stringify(res.body);
    expect(body).not.toContain(refreshToken); // never in JSON
    expect(body).not.toMatch(/passwordHash|refreshToken|failedLoginCount|lockedUntil/);
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("sets an httpOnly, SameSite=Strict cookie scoped to the auth endpoints", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const res = await h.api
      .post("/auth/login")
      .send({ identifier: "owner@example.test", password: DEFAULT_PASSWORD });
    const setCookie = h.setCookies(res).find((c) => c.startsWith("ssb_refresh="))!;
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Strict/i);
    expect(setCookie).toMatch(/Path=\/api\/v1\/auth/);
    expect(setCookie).toMatch(/Max-Age=2592000/); // 30 days
  });

  it("in production the cookie is Secure and uses the __Secure- prefix", async () => {
    const h = createAuthHarness({
      env: {
        NODE_ENV: "production",
        CLIENT_URL: "https://www.example.org",
        PASSWORD_HASH_COST: "10",
        SMTP_HOST: "smtp.example.org",
        SMTP_PORT: "587",
        SMTP_FROM: "Sri Sai Balaji <no-reply@example.org>",
      },
    });
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const res = await h.api
      .post("/auth/login")
      .set("Origin", "https://www.example.org")
      .send({ identifier: "owner@example.test", password: DEFAULT_PASSWORD });
    expect(res.status).toBe(200);
    const setCookie = h.setCookies(res).find((c) => c.startsWith("__Secure-ssb_refresh="))!;
    expect(setCookie).toMatch(/; Secure/i);
    expect(setCookie).toMatch(/HttpOnly/i);
  });

  it("stores only a HASH of the refresh token", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const { cookie } = await h.login("owner@example.test");
    const plain = cookie.split("=")[1]!;
    const stored = h.db.refreshToken.rows[0]!;
    expect(stored.tokenHash).toBe(createHash("sha256").update(plain).digest("hex"));
    expect(JSON.stringify(h.db.refreshToken.rows)).not.toContain(plain);
  });

  it("accepts a mobile number in any common format", async () => {
    const h = createAuthHarness();
    await h.createUser({
      role: "STUDENT",
      email: null,
      phone: "+919666146913",
      profile: "student",
    });
    for (const identifier of ["9666146913", "96661 46913", "+91 96661 46913", "09666146913"]) {
      const { res } = await h.login(identifier);
      expect(res.status, identifier).toBe(200);
    }
  });

  it("records the login in the audit log without any secret", async () => {
    const h = createAuthHarness();
    const user = await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const { cookie } = await h.login("owner@example.test");
    const audit = JSON.stringify(h.db.auditLog.rows);
    expect(h.db.auditLog.rows.some((r) => r.action === "auth.login" && r.actorId === user.id)).toBe(
      true,
    );
    expect(audit).not.toContain(DEFAULT_PASSWORD);
    expect(audit).not.toContain(cookie.split("=")[1]!);
  });
});

describe("POST /auth/login: failure", () => {
  it("gives the SAME answer for an unknown account and a wrong password (no user enumeration)", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });

    const wrongPassword = await h.api
      .post("/auth/login")
      .send({ identifier: "owner@example.test", password: "Wrong-password-1" });
    const unknownAccount = await h.api
      .post("/auth/login")
      .send({ identifier: "nobody@example.test", password: "Wrong-password-1" });
    const badIdentifier = await h.api
      .post("/auth/login")
      .send({ identifier: "12345", password: "Wrong-password-1" });

    for (const res of [wrongPassword, unknownAccount, badIdentifier]) {
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials." },
      });
      expect(h.refreshCookieOf(res)).toBeUndefined();
    }
  });

  it("rejects an inactive account with the same generic answer, even with the right password", async () => {
    const h = createAuthHarness();
    await h.createUser({
      role: "STUDENT",
      email: "s@example.test",
      isActive: false,
      profile: "student",
    });
    const { res } = await h.login("s@example.test");
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid credentials.");
  });

  it("rejects a deleted account", async () => {
    const h = createAuthHarness();
    const user = await h.createUser({
      role: "STUDENT",
      email: "s@example.test",
      profile: "student",
    });
    await h.db.user.update({ where: { id: user.id }, data: { deletedAt: new Date() } });
    expect((await h.login("s@example.test")).res.status).toBe(401);
  });

  it("locks the account after repeated failures and refuses even the right password until the lock expires", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });

    for (let i = 0; i < MAX_FAILED_LOGINS; i++) {
      expect((await h.login("owner@example.test", "Wrong-password-1")).res.status).toBe(401);
    }
    const locked = await h.login("owner@example.test", DEFAULT_PASSWORD);
    expect(locked.res.status).toBe(401);
    expect(locked.res.body.error.message).toBe("Invalid credentials."); // the lock is not revealed

    h.clock.advance(LOCK_MS + 1000);
    expect((await h.login("owner@example.test", DEFAULT_PASSWORD)).res.status).toBe(200);
    expect(h.db.auditLog.rows.some((r) => r.action === "auth.account_locked")).toBe(true);
  });

  it("resets the failure counter after a successful login", async () => {
    const h = createAuthHarness();
    const user = await h.createUser({ role: "OWNER", email: "owner@example.test" });
    await h.login("owner@example.test", "Wrong-password-1");
    await h.login("owner@example.test", "Wrong-password-1");
    expect((await h.db.user.findUnique({ where: { id: user.id } }))!.failedLoginCount).toBe(2);
    await h.login("owner@example.test");
    expect((await h.db.user.findUnique({ where: { id: user.id } }))!.failedLoginCount).toBe(0);
  });

  it("validates the request body", async () => {
    const h = createAuthHarness();
    const res = await h.api.post("/auth/login").send({ identifier: "", password: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect((res.body.error.details as { path: string }[]).map((d) => d.path).sort()).toEqual([
      "body.identifier",
      "body.password",
    ]);
  });

  it("does not apply the password policy at login (it must accept whatever was set)", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test", password: "short" });
    expect((await h.login("owner@example.test", "short")).res.status).toBe(200);
  });
});

describe("POST /auth/login: rate limiting", () => {
  it("returns 429 after too many FAILED attempts from one client", async () => {
    const h = createAuthHarness({ env: { LOGIN_RATE_LIMIT_MAX: "3" } });
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      // Different identifiers so the per-account lock does not interfere.
      const res = await h.api
        .post("/auth/login")
        .send({ identifier: `nobody${i}@example.test`, password: "Wrong-password-1" });
      statuses.push(res.status);
      if (res.status === 429) expect(res.body.error.code).toBe("RATE_LIMITED");
    }
    expect(statuses).toEqual([401, 401, 401, 429, 429]);
  });

  it("does NOT count successful logins, so normal users are never blocked", async () => {
    const h = createAuthHarness({ env: { LOGIN_RATE_LIMIT_MAX: "2" } });
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    for (let i = 0; i < 6; i++) expect((await h.login("owner@example.test")).res.status).toBe(200);
  });
});

describe("cookie endpoints: request origin (CSRF) protection", () => {
  it("rejects a login without the custom client header", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const res = await h.api
      .raw()
      .post("/api/v1/auth/login")
      .send({ identifier: "owner@example.test", password: DEFAULT_PASSWORD });
    expect(res.status).toBe(403);
  });

  it("rejects a request from a foreign Origin, even with the header", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const res = await h.api
      .post("/auth/login")
      .set("Origin", "https://evil.example.org")
      .send({ identifier: "owner@example.test", password: DEFAULT_PASSWORD });
    expect(res.status).toBe(403);
    expect(h.refreshCookieOf(res)).toBeUndefined();
  });

  it("accepts the configured web origin", async () => {
    const h = createAuthHarness({ env: { CLIENT_URL: "https://www.example.org" } });
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const res = await h.api
      .post("/auth/login")
      .set("Origin", "https://www.example.org")
      .send({ identifier: "owner@example.test", password: DEFAULT_PASSWORD });
    expect(res.status).toBe(200);
  });

  it("protects refresh and logout the same way", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const { cookie } = await h.login("owner@example.test");
    for (const path of ["/api/v1/auth/refresh", "/api/v1/auth/logout"]) {
      const res = await h.api.raw().post(path).set("Cookie", cookie).send();
      expect(res.status, path).toBe(403);
    }
  });
});

describe("logging never contains secrets", () => {
  it("does not write passwords, access tokens or refresh tokens to the log", async () => {
    const { logger, lines } = capturingLogger();
    const h = createAuthHarness({ logger });
    await h.createUser({
      role: "OWNER",
      email: "owner@example.test",
      password: "Super-secret-PW-12345",
    });

    await h.login("owner@example.test", "Wrong-Try-Password-999");
    const ok = await h.login("owner@example.test", "Super-secret-PW-12345");
    await h.api.post("/auth/refresh").set("Cookie", ok.cookie).send();
    await h.api.get("/auth/me").set(h.bearer(ok.accessToken));

    const text = JSON.stringify(lines);
    for (const secret of [
      "Super-secret-PW-12345",
      "Wrong-Try-Password-999",
      ok.accessToken,
      ok.cookie.split("=")[1]!,
    ]) {
      expect(text).not.toContain(secret);
    }
  });

  it("the test environment is valid (guards the harness itself)", () => {
    expect(testEnv({ PASSWORD_HASH_COST: "4" }).PASSWORD_HASH_COST).toBe(4);
  });
});
