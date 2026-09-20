import { describe, expect, it } from "vitest";
import { createAuthHarness, DEFAULT_PASSWORD, type AuthHarness } from "../../test/authHarness.js";
import { FORGOT_PASSWORD_MESSAGE } from "./auth.controller.js";

const NEW_PASSWORD = "New-strong-passphrase-77";

const tokenFromEmail = (text: string) => /token=([A-Za-z0-9_-]+)/.exec(text)?.[1] ?? "";

async function requestReset(h: AuthHarness, email: string) {
  const res = await h.api.post("/auth/forgot-password").send({ email });
  // The controller answers first and does the work afterwards.
  await new Promise((r) => setTimeout(r, 20));
  await h.flush();
  return res;
}

describe("POST /auth/change-password", () => {
  it("changes the password, keeps this device signed in, and signs every other device out", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const deviceA = await h.login("owner@example.test");
    const deviceB = await h.login("owner@example.test");

    const res = await h.api
      .post("/auth/change-password")
      .set(h.bearer(deviceB.accessToken))
      .send({ currentPassword: DEFAULT_PASSWORD, newPassword: NEW_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    const newCookie = h.refreshCookieOf(res)!;
    expect(newCookie).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toContain(newCookie.split("=")[1]!);

    // Other device: access token and refresh token are both dead.
    expect((await h.api.get("/auth/me").set(h.bearer(deviceA.accessToken))).status).toBe(401);
    expect((await h.api.post("/auth/refresh").set("Cookie", deviceA.cookie).send()).status).toBe(
      401,
    );
    // The old access token on the changing device is dead too; the NEW session works.
    expect((await h.api.get("/auth/me").set(h.bearer(deviceB.accessToken))).status).toBe(401);
    expect(
      (await h.api.get("/auth/me").set(h.bearer(res.body.data.accessToken as string))).status,
    ).toBe(200);
    expect((await h.api.post("/auth/refresh").set("Cookie", newCookie).send()).status).toBe(200);

    // New password works, old one does not.
    expect((await h.login("owner@example.test", NEW_PASSWORD)).res.status).toBe(200);
    expect((await h.login("owner@example.test", DEFAULT_PASSWORD)).res.status).toBe(401);
    expect(h.db.auditLog.rows.some((r) => r.action === "auth.password_changed")).toBe(true);
    expect(JSON.stringify(h.db.auditLog.rows)).not.toContain(NEW_PASSWORD);
  });

  it("stores only a bcrypt hash of the new password", async () => {
    const h = createAuthHarness();
    const user = await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const s = await h.login("owner@example.test");
    await h.api
      .post("/auth/change-password")
      .set(h.bearer(s.accessToken))
      .send({ currentPassword: DEFAULT_PASSWORD, newPassword: NEW_PASSWORD });
    const stored = (await h.db.user.findUnique({ where: { id: user.id } }))!.passwordHash as string;
    expect(stored).toMatch(/^\$2[aby]\$\d\d\$/);
    expect(stored).not.toContain(NEW_PASSWORD);
  });

  it("answers a wrong CURRENT password with 400 (not 401, which would sign the person out)", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const s = await h.login("owner@example.test");
    const res = await h.api
      .post("/auth/change-password")
      .set(h.bearer(s.accessToken))
      .send({ currentPassword: "Not-my-password-1", newPassword: NEW_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details[0].path).toBe("body.currentPassword");
    expect((await h.api.get("/auth/me").set(h.bearer(s.accessToken))).status).toBe(200); // still signed in
  });

  it("requires a signed-in user", async () => {
    const h = createAuthHarness();
    const res = await h.api
      .post("/auth/change-password")
      .send({ currentPassword: "x", newPassword: NEW_PASSWORD });
    expect(res.status).toBe(401);
  });

  it.each([
    ["too short", "Ab1!xyz", /at least 10/],
    ["only digits", "1234567890123", /only numbers/],
    ["too common", "password123", /too common/],
    ["one repeated character", "aaaaaaaaaaaa", /repeat a single character/],
    ["longer than 72 bytes", "x1".repeat(40), /no more than 72/],
  ])("enforces the password policy: %s", async (_name, newPassword, message) => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const s = await h.login("owner@example.test");
    const res = await h.api
      .post("/auth/change-password")
      .set(h.bearer(s.accessToken))
      .send({ currentPassword: DEFAULT_PASSWORD, newPassword });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.error.details)).toMatch(message);
  });

  it("refuses a new password equal to the account's own email address", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner.longname@example.test" });
    const s = await h.login("owner.longname@example.test");
    const res = await h.api
      .post("/auth/change-password")
      .set(h.bearer(s.accessToken))
      .send({ currentPassword: DEFAULT_PASSWORD, newPassword: "owner.longname@example.test" });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.error.details)).toMatch(/own email/);
  });

  it("refuses to reuse the current password", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const s = await h.login("owner@example.test");
    const res = await h.api
      .post("/auth/change-password")
      .set(h.bearer(s.accessToken))
      .send({ currentPassword: DEFAULT_PASSWORD, newPassword: DEFAULT_PASSWORD });
    expect(res.status).toBe(400);
  });

  it("rate limits repeated wrong current passwords", async () => {
    const h = createAuthHarness({ env: { LOGIN_RATE_LIMIT_MAX: "2" } });
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const s = await h.login("owner@example.test");
    const attempt = () =>
      h.api
        .post("/auth/change-password")
        .set(h.bearer(s.accessToken))
        .send({ currentPassword: "Nope-nope-nope-1", newPassword: NEW_PASSWORD });
    expect([(await attempt()).status, (await attempt()).status, (await attempt()).status]).toEqual([
      400, 400, 429,
    ]);
  });
});

describe("forced password change (mustChangePassword)", () => {
  it("blocks every guarded endpoint until the password is changed, but not /auth/me or change-password", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "ADMIN", email: "admin@example.test", mustChangePassword: true });
    const s = await h.login("admin@example.test");
    expect(s.res.body.data.user.mustChangePassword).toBe(true);

    const blocked = await h.api.post("/users").set(h.bearer(s.accessToken)).send({});
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");
    const blockedRead = await h.api
      .get("/students/00000000-0000-4000-8000-000000000000")
      .set(h.bearer(s.accessToken));
    expect(blockedRead.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");

    expect((await h.api.get("/auth/me").set(h.bearer(s.accessToken))).status).toBe(200);

    const changed = await h.api
      .post("/auth/change-password")
      .set(h.bearer(s.accessToken))
      .send({ currentPassword: DEFAULT_PASSWORD, newPassword: NEW_PASSWORD });
    expect(changed.status).toBe(200);
    expect(changed.body.data.user.mustChangePassword).toBe(false);

    const now = await h.api
      .post("/users")
      .set(h.bearer(changed.body.data.accessToken as string))
      .send({});
    expect(now.status).toBe(400); // permission granted; only the empty body is rejected
  });

  it("refreshing the session keeps the requirement in force", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "ADMIN", email: "admin@example.test", mustChangePassword: true });
    const s = await h.login("admin@example.test");
    const refreshed = await h.api.post("/auth/refresh").set("Cookie", s.cookie).send();
    expect(refreshed.body.data.user.mustChangePassword).toBe(true);
    const blocked = await h.api
      .post("/users")
      .set(h.bearer(refreshed.body.data.accessToken as string))
      .send({});
    expect(blocked.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");
  });
});

describe("password reset", () => {
  it("answers identically whether or not the account exists (no enumeration)", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const known = await requestReset(h, "owner@example.test");
    const unknown = await requestReset(h, "nobody@example.test");

    for (const res of [known, unknown]) {
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: { message: FORGOT_PASSWORD_MESSAGE } });
    }
    expect(h.sent).toHaveLength(1); // only the real account got an email
    expect(h.sent[0]!.to).toBe("owner@example.test");
  });

  it("emails a single-use link and stores only its hash", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test", fullName: "P. Mahesh" });
    await requestReset(h, "owner@example.test");

    const mail = h.sent[0]!;
    expect(mail.subject).toMatch(/reset/i);
    const token = tokenFromEmail(mail.text);
    expect(token.length).toBeGreaterThan(30);
    expect(mail.text).toContain(`${h.env.clientOrigin}/auth/reset-password?token=${token}`);
    expect(mail.sensitive).toBe(true);
    expect(JSON.stringify(h.db.authToken.rows)).not.toContain(token); // hash only
    expect(h.db.authToken.rows).toHaveLength(1);
    expect(h.db.auditLog.rows.some((r) => r.action === "auth.password_reset_requested")).toBe(true);
  });

  it("wipes the link from the outbox once it has been sent", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    await requestReset(h, "owner@example.test");
    const row = h.db.notification.rows[0]!;
    expect(row.status).toBe("SENT");
    expect(row.payload).toEqual({ scrubbed: true });
  });

  it("resets the password once, then the link is dead", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    await requestReset(h, "owner@example.test");
    const token = tokenFromEmail(h.sent[0]!.text);

    const ok = await h.api.post("/auth/reset-password").send({ token, newPassword: NEW_PASSWORD });
    expect(ok.status).toBe(200);
    expect((await h.login("owner@example.test", NEW_PASSWORD)).res.status).toBe(200);

    const again = await h.api
      .post("/auth/reset-password")
      .send({ token, newPassword: "Another-strong-pass-88" });
    expect(again.status).toBe(400);
    expect(again.body.error.code).toBe("INVALID_TOKEN");
    expect(h.db.auditLog.rows.some((r) => r.action === "auth.password_reset")).toBe(true);
  });

  it("revokes every existing session and clears lockouts", async () => {
    const h = createAuthHarness();
    const user = await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const s = await h.login("owner@example.test");
    await h.db.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 3, lockedUntil: new Date(h.clock.now().getTime() + 60_000) },
    });
    await requestReset(h, "owner@example.test");
    await h.api
      .post("/auth/reset-password")
      .send({ token: tokenFromEmail(h.sent[0]!.text), newPassword: NEW_PASSWORD });

    expect((await h.api.get("/auth/me").set(h.bearer(s.accessToken))).status).toBe(401);
    expect((await h.api.post("/auth/refresh").set("Cookie", s.cookie).send()).status).toBe(401);
    expect((await h.login("owner@example.test", NEW_PASSWORD)).res.status).toBe(200); // unlocked
  });

  it("rejects an expired link (valid for 1 hour)", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    await requestReset(h, "owner@example.test");
    const token = tokenFromEmail(h.sent[0]!.text);
    h.clock.advance(61 * 60_000);
    const res = await h.api.post("/auth/reset-password").send({ token, newPassword: NEW_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_TOKEN");
    expect((await h.login("owner@example.test", NEW_PASSWORD)).res.status).toBe(401);
  });

  it("gives the same generic error for an unknown, malformed or wrong-type token", async () => {
    const h = createAuthHarness();
    const user = await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const bad = await h.api
      .post("/auth/reset-password")
      .send({ token: "x".repeat(43), newPassword: NEW_PASSWORD });
    expect(bad.body.error.code).toBe("INVALID_TOKEN");

    // An invitation token must not work as a reset token.
    const { createOneTimeToken } = await import("./one-time-tokens.js");
    const invite = await createOneTimeToken(
      h.db.asPrisma(),
      user.id,
      "INVITE",
      60_000,
      h.clock.now(),
    );
    const wrongType = await h.api
      .post("/auth/reset-password")
      .send({ token: invite.token, newPassword: NEW_PASSWORD });
    expect(wrongType.status).toBe(400);
    expect(wrongType.body.error.code).toBe("INVALID_TOKEN");
  });

  it("a weak new password does not burn the link", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    await requestReset(h, "owner@example.test");
    const token = tokenFromEmail(h.sent[0]!.text);
    expect(
      (await h.api.post("/auth/reset-password").send({ token, newPassword: "short" })).status,
    ).toBe(400);
    expect(
      (await h.api.post("/auth/reset-password").send({ token, newPassword: NEW_PASSWORD })).status,
    ).toBe(200);
  });

  it("only the newest link works when several were requested", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    await requestReset(h, "owner@example.test");
    await requestReset(h, "owner@example.test");
    const [first, second] = h.sent.map((m) => tokenFromEmail(m.text));
    expect(
      (await h.api.post("/auth/reset-password").send({ token: first, newPassword: NEW_PASSWORD }))
        .status,
    ).toBe(400);
    expect(
      (await h.api.post("/auth/reset-password").send({ token: second, newPassword: NEW_PASSWORD }))
        .status,
    ).toBe(200);
  });

  it("two simultaneous uses of one link: exactly one succeeds", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    await requestReset(h, "owner@example.test");
    const token = tokenFromEmail(h.sent[0]!.text);
    const results = await Promise.all([
      h.api.post("/auth/reset-password").send({ token, newPassword: NEW_PASSWORD }),
      h.api.post("/auth/reset-password").send({ token, newPassword: "Second-strong-pass-99" }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 400]);
  });

  it("does not email inactive accounts", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test", isActive: false });
    await requestReset(h, "owner@example.test");
    expect(h.sent).toHaveLength(0);
  });

  it("is rate limited per client", async () => {
    const h = createAuthHarness({ env: { PASSWORD_RESET_RATE_LIMIT_MAX: "2" } });
    const send = () => h.api.post("/auth/forgot-password").send({ email: "a@example.test" });
    expect([(await send()).status, (await send()).status, (await send()).status]).toEqual([
      200, 200, 429,
    ]);
  });

  it("validates the email format", async () => {
    const h = createAuthHarness();
    expect((await h.api.post("/auth/forgot-password").send({ email: "not-an-email" })).status).toBe(
      400,
    );
  });

  it("in development without SMTP, the link is only logged when explicitly enabled", async () => {
    const { createLogEmailProvider } = await import("../../integrations/email/email-provider.js");
    const { capturingLogger } = await import("../../test/helpers.js");
    const message = {
      to: "a@example.test",
      subject: "Reset",
      text: "Link: https://x/reset?token=SECRETLINK",
      sensitive: true,
    };

    const hidden = capturingLogger();
    await createLogEmailProvider(hidden.logger, { logSensitiveBodies: false }).send(message);
    expect(JSON.stringify(hidden.lines)).not.toContain("SECRETLINK");
    expect(JSON.stringify(hidden.lines)).toContain("NOT sent");

    const shown = capturingLogger();
    await createLogEmailProvider(shown.logger, { logSensitiveBodies: true }).send(message);
    expect(JSON.stringify(shown.lines)).toContain("SECRETLINK");
  });
});

describe("invitation acceptance (no self-registration)", () => {
  async function inviteStudent(h: AuthHarness, email = "student@example.test") {
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const owner = await h.login("owner@example.test");
    const branch = await h.ensureBranch();
    const res = await h.api
      .post("/users")
      .set(h.bearer(owner.accessToken))
      .send({ role: "STUDENT", fullName: "Asha Reddy", email, branchId: branch.id });
    await h.flush();
    return { res, token: tokenFromEmail(h.sent.at(-1)?.text ?? "") };
  }

  it("the invited person sets their own password with a single-use link and can then sign in", async () => {
    const h = createAuthHarness();
    const { res, token } = await inviteStudent(h);
    expect(res.status).toBe(201);
    expect(token.length).toBeGreaterThan(30);
    expect(h.sent.at(-1)!.subject).toMatch(/account/i);

    // Before accepting they cannot sign in with anything.
    expect((await h.login("student@example.test", "Whatever-guess-1")).res.status).toBe(401);

    const accepted = await h.api
      .post("/auth/accept-invite")
      .send({ token, password: NEW_PASSWORD });
    expect(accepted.status).toBe(200);
    expect(h.refreshCookieOf(accepted)).toBeUndefined(); // no automatic sign-in
    const login = await h.login("student@example.test", NEW_PASSWORD);
    expect(login.res.status).toBe(200);
    expect(login.user!.role).toBe("STUDENT");
    expect(h.db.auditLog.rows.some((r) => r.action === "auth.invite_accepted")).toBe(true);
  });

  it("the link works only once", async () => {
    const h = createAuthHarness();
    const { token } = await inviteStudent(h);
    expect(
      (await h.api.post("/auth/accept-invite").send({ token, password: NEW_PASSWORD })).status,
    ).toBe(200);
    const again = await h.api
      .post("/auth/accept-invite")
      .send({ token, password: "Another-strong-pass-88" });
    expect(again.status).toBe(400);
    expect(again.body.error.code).toBe("INVALID_TOKEN");
  });

  it("the link expires after 7 days", async () => {
    const h = createAuthHarness();
    const { token } = await inviteStudent(h);
    h.clock.advance(8 * 86_400_000);
    expect(
      (await h.api.post("/auth/accept-invite").send({ token, password: NEW_PASSWORD })).body.error
        .code,
    ).toBe("INVALID_TOKEN");
  });

  it("stores only a hash of the token and enforces the password policy", async () => {
    const h = createAuthHarness();
    const { token } = await inviteStudent(h);
    expect(JSON.stringify(h.db.authToken.rows)).not.toContain(token);
    expect(
      (await h.api.post("/auth/accept-invite").send({ token, password: "short" })).status,
    ).toBe(400);
    expect(
      (await h.api.post("/auth/accept-invite").send({ token, password: NEW_PASSWORD })).status,
    ).toBe(200); // link not burned
  });

  it("a reset token cannot be used to accept an invite", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "STUDENT", email: "s@example.test", profile: "student" });
    await requestReset(h, "s@example.test");
    const token = tokenFromEmail(h.sent[0]!.text);
    expect(
      (await h.api.post("/auth/accept-invite").send({ token, password: NEW_PASSWORD })).body.error
        .code,
    ).toBe("INVALID_TOKEN");
  });

  it("never emails a password, and the emailed link is the only secret in it", async () => {
    const h = createAuthHarness();
    await inviteStudent(h);
    const body = h.sent.at(-1)!.text;
    expect(body).not.toMatch(/(temporary|your|new) password (is|:)/i);
    expect(body).toMatch(/Set your password: https?:\/\//);
  });

  it("without an email address the inviting staff member receives the link once, in the API response", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const owner = await h.login("owner@example.test");
    const branch = await h.ensureBranch();
    const res = await h.api
      .post("/users")
      .set(h.bearer(owner.accessToken))
      .send({ role: "STUDENT", fullName: "Phone Only", phone: "9666146913", branchId: branch.id });
    expect(res.status).toBe(201);
    expect(res.body.data.invite.emailed).toBe(false);
    const token = tokenFromEmail(res.body.data.invite.link as string);
    expect(
      (await h.api.post("/auth/accept-invite").send({ token, password: NEW_PASSWORD })).status,
    ).toBe(200);
    expect((await h.login("9666146913", NEW_PASSWORD)).res.status).toBe(200);
  });
});
