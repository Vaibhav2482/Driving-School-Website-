import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { createAuthHarness, type AuthHarness } from "../../test/authHarness.js";

async function signedInOwner(h: AuthHarness) {
  const user = await h.createUser({ role: "OWNER", email: "owner@example.test" });
  const session = await h.login("owner@example.test");
  return { ...session, owner: user };
}

const refresh = (h: AuthHarness, cookie: string) =>
  h.api.post("/auth/refresh").set("Cookie", cookie).send();
const me = (h: AuthHarness, token: string) => h.api.get("/auth/me").set(h.bearer(token));

describe("POST /auth/refresh: rotation", () => {
  it("issues a new access token and a NEW refresh cookie, revoking the old token in the same family", async () => {
    const h = createAuthHarness();
    const s = await signedInOwner(h);

    h.clock.advance(1000); // a later moment, so the new access token differs from the first
    const res = await refresh(h, s.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("OWNER");
    expect(res.body.data.accessToken).not.toBe(s.accessToken);
    const newCookie = h.refreshCookieOf(res)!;
    expect(newCookie).toBeTruthy();
    expect(newCookie).not.toBe(s.cookie);
    expect(JSON.stringify(res.body)).not.toContain(newCookie.split("=")[1]!); // never in the body

    const [oldRow, newRow] = h.db.refreshToken.rows as {
      familyId: string;
      revokedAt: Date | null;
      replacedById: string | null;
      id: string;
    }[];
    expect(newRow!.familyId).toBe(oldRow!.familyId); // same family
    expect(oldRow!.revokedAt).not.toBeNull(); // old one revoked
    expect(oldRow!.replacedById).toBe(newRow!.id); // and linked to its successor
    expect(newRow!.revokedAt).toBeNull();
    expect(h.db.refreshToken.rows).toHaveLength(2);
  });

  it("the new token can be rotated again, and the new access token works", async () => {
    const h = createAuthHarness();
    const s = await signedInOwner(h);
    const first = await refresh(h, s.cookie);
    const second = await refresh(h, h.refreshCookieOf(first)!);
    expect(second.status).toBe(200);
    expect((await me(h, second.body.data.accessToken as string)).status).toBe(200);
  });

  it("answers 401 SESSION_INVALID and clears the cookie when there is no cookie or a bad one", async () => {
    const h = createAuthHarness();
    await signedInOwner(h);
    const none = await h.api.post("/auth/refresh").send();
    expect(none.status).toBe(401);
    expect(none.body.error.code).toBe("SESSION_INVALID");

    const bad = await refresh(h, "ssb_refresh=not-a-real-token");
    expect(bad.status).toBe(401);
    expect(bad.body.error.code).toBe("SESSION_INVALID");
    expect(h.setCookies(bad).join(";")).toMatch(/ssb_refresh=;/); // cleared
  });

  it("rejects an expired refresh token and revokes its session", async () => {
    const h = createAuthHarness();
    const s = await signedInOwner(h);
    h.clock.advance(31 * 86_400_000); // 30-day lifetime elapsed
    const res = await refresh(h, s.cookie);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("SESSION_INVALID");
    expect((h.db.refreshToken.rows[0] as { revokedAt: Date | null }).revokedAt).not.toBeNull();
  });

  it("rejects refresh for a user who has since been deactivated, and revokes the session", async () => {
    const h = createAuthHarness();
    const s = await signedInOwner(h);
    await h.db.user.update({ where: { id: s.owner.id }, data: { isActive: false } });
    expect((await refresh(h, s.cookie)).status).toBe(401);
    expect((h.db.refreshToken.rows[0] as { revokedAt: Date | null }).revokedAt).not.toBeNull();
  });
});

describe("POST /auth/refresh: reuse detection", () => {
  it("presenting an already-rotated token revokes the WHOLE family and forces re-authentication", async () => {
    const h = createAuthHarness();
    const s = await signedInOwner(h);
    const rotated = await refresh(h, s.cookie);
    const newCookie = h.refreshCookieOf(rotated)!;
    const newAccess = rotated.body.data.accessToken as string;

    h.clock.advance(60_000); // well past the concurrent-request grace window
    const replay = await refresh(h, s.cookie); // an attacker (or a stale client) replays the OLD token
    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe("SESSION_INVALID");

    // The legitimate, newer token is dead too: everyone must sign in again.
    expect((await refresh(h, newCookie)).status).toBe(401);
    expect(
      (h.db.refreshToken.rows as { revokedAt: Date | null }[]).every((r) => r.revokedAt !== null),
    ).toBe(true);
    // ...and so is the access token that belonged to the session.
    expect((await me(h, newAccess)).status).toBe(401);
    expect(
      h.db.auditLog.rows.some(
        (r) => r.action === "auth.refresh_reuse_detected" && r.actorId === s.owner.id,
      ),
    ).toBe(true);
  });

  it("a replay within the grace window is treated as a harmless race (409) and does NOT kill the session", async () => {
    const h = createAuthHarness();
    const s = await signedInOwner(h);
    const rotated = await refresh(h, s.cookie);
    const newCookie = h.refreshCookieOf(rotated)!;

    const race = await refresh(h, s.cookie); // e.g. a second tab, a moment later
    expect(race.status).toBe(409);
    expect(race.body.error.code).toBe("REFRESH_RACE");
    expect(h.db.auditLog.rows.some((r) => r.action === "auth.refresh_reuse_detected")).toBe(false);
    expect((await refresh(h, newCookie)).status).toBe(200); // the session survives
  });

  it("presenting a logged-out (revoked) token is refused and audited", async () => {
    const h = createAuthHarness();
    const s = await signedInOwner(h);
    await h.api.post("/auth/logout").set("Cookie", s.cookie).send();
    h.clock.advance(60_000);
    const res = await refresh(h, s.cookie);
    expect(res.status).toBe(401);
    expect(h.db.auditLog.rows.some((r) => r.action === "auth.refresh_reuse_detected")).toBe(true);
  });
});

describe("POST /auth/refresh: concurrent requests", () => {
  it("of several simultaneous refreshes with the same token exactly ONE wins and the session survives", async () => {
    const h = createAuthHarness();
    const s = await signedInOwner(h);

    const results = await Promise.all([
      refresh(h, s.cookie),
      refresh(h, s.cookie),
      refresh(h, s.cookie),
      refresh(h, s.cookie),
    ]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 409, 409, 409]);

    const winner = results.find((r) => r.status === 200)!;
    const active = (h.db.refreshToken.rows as { revokedAt: Date | null }[]).filter(
      (r) => r.revokedAt === null,
    );
    expect(active).toHaveLength(1); // exactly one live token: no duplicate sessions
    expect((await refresh(h, h.refreshCookieOf(winner)!)).status).toBe(200); // and it works
    expect(h.db.auditLog.rows.some((r) => r.action === "auth.refresh_reuse_detected")).toBe(false);
  });
});

describe("POST /auth/logout", () => {
  it("revokes the session, clears the cookie, and prevents further refresh and API use", async () => {
    const h = createAuthHarness();
    const s = await signedInOwner(h);

    const res = await h.api.post("/auth/logout").set("Cookie", s.cookie).send();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { loggedOut: true } });
    expect(h.setCookies(res).join(";")).toMatch(/ssb_refresh=;/);

    expect(
      (h.db.refreshToken.rows as { revokedAt: Date | null }[]).every((r) => r.revokedAt !== null),
    ).toBe(true);
    expect((await refresh(h, s.cookie)).status).toBe(401);
    expect((await me(h, s.accessToken)).status).toBe(401); // the access token dies immediately, not in 15 minutes
    expect(
      h.db.auditLog.rows.some((r) => r.action === "auth.logout" && r.actorId === s.owner.id),
    ).toBe(true);
  });

  it("is harmless without a cookie (idempotent)", async () => {
    const h = createAuthHarness();
    const res = await h.api.post("/auth/logout").send();
    expect(res.status).toBe(200);
  });

  it("only ends the session it was called for; the person's other devices stay signed in", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "OWNER", email: "owner@example.test" });
    const phone = await h.login("owner@example.test");
    const laptop = await h.login("owner@example.test");
    await h.api.post("/auth/logout").set("Cookie", phone.cookie).send();
    expect((await me(h, phone.accessToken)).status).toBe(401);
    expect((await me(h, laptop.accessToken)).status).toBe(200);
  });
});

describe("access tokens", () => {
  it("expire after 15 minutes (TOKEN_EXPIRED), and a refresh gets a new one", async () => {
    const h = createAuthHarness();
    const s = await signedInOwner(h);
    expect((await me(h, s.accessToken)).status).toBe(200);

    h.clock.advance(14 * 60_000);
    expect((await me(h, s.accessToken)).status).toBe(200);

    h.clock.advance(2 * 60_000);
    const expired = await me(h, s.accessToken);
    expect(expired.status).toBe(401);
    expect(expired.body.error.code).toBe("TOKEN_EXPIRED");

    const renewed = await refresh(h, s.cookie);
    expect(renewed.status).toBe(200);
    expect((await me(h, renewed.body.data.accessToken as string)).status).toBe(200);
  });

  it("are rejected when missing, malformed, or not a Bearer token", async () => {
    const h = createAuthHarness();
    await signedInOwner(h);
    expect((await h.api.get("/auth/me")).status).toBe(401);
    expect((await h.api.get("/auth/me").set("Authorization", "Bearer")).status).toBe(401);
    expect((await h.api.get("/auth/me").set("Authorization", "Bearer not.a.jwt")).status).toBe(401);
    expect((await h.api.get("/auth/me").set("Authorization", "Basic abc123")).status).toBe(401);
  });

  it("are rejected when signed with a different secret, or with alg=none", async () => {
    const h = createAuthHarness();
    const s = await signedInOwner(h);
    const claims = jwt.decode(s.accessToken) as jwt.JwtPayload;

    const wrongSecret = jwt.sign(claims, "some-other-secret-that-is-long-enough-000000", {
      algorithm: "HS256",
    });
    expect((await me(h, wrongSecret)).status).toBe(401);

    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.`;
    expect((await me(h, none)).status).toBe(401);
  });

  it("are rejected with the wrong issuer or audience", async () => {
    const h = createAuthHarness();
    const s = await signedInOwner(h);
    const claims = jwt.decode(s.accessToken) as jwt.JwtPayload;
    const secret = h.env.JWT_ACCESS_SECRET;
    expect((await me(h, jwt.sign({ ...claims, iss: "someone-else" }, secret))).status).toBe(401);
    expect((await me(h, jwt.sign({ ...claims, aud: "another-app" }, secret))).status).toBe(401);
  });

  it("are rejected when their session id is unknown (a validly signed token for no live session)", async () => {
    const h = createAuthHarness();
    const s = await signedInOwner(h);
    const claims = jwt.decode(s.accessToken) as jwt.JwtPayload;
    const forged = jwt.sign(
      { ...claims, sid: "00000000-0000-4000-8000-000000000000" },
      h.env.JWT_ACCESS_SECRET,
    );
    expect((await me(h, forged)).status).toBe(401);
  });

  it("stop working the moment the user is deactivated", async () => {
    const h = createAuthHarness();
    const s = await signedInOwner(h);
    await h.db.user.update({ where: { id: s.owner.id }, data: { isActive: false } });
    expect((await me(h, s.accessToken)).status).toBe(401);
  });

  it("carry the role from the DATABASE, so a demotion applies immediately", async () => {
    const h = createAuthHarness();
    await h.createUser({ role: "ADMIN", email: "admin@example.test" });
    const s = await h.login("admin@example.test");
    const before = await h.api.post("/users").set(h.bearer(s.accessToken)).send({});
    expect(before.status).toBe(400); // allowed to try (validation runs), so permission was granted
    await h.db.user.update({ where: { id: s.user!.id }, data: { role: "STUDENT" } });
    const after = await h.api.post("/users").set(h.bearer(s.accessToken)).send({});
    expect(after.status).toBe(403);
  });
});

describe("GET /auth/me", () => {
  it("returns the current user's safe details and permissions", async () => {
    const h = createAuthHarness();
    const s = await signedInOwner(h);
    const res = await me(h, s.accessToken);
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({
      id: s.owner.id,
      role: "OWNER",
      email: "owner@example.test",
    });
    expect(res.body.data.user.permissions).toContain("audit:read");
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
  });
});
