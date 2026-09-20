import { describe, expect, it } from "vitest";
import {
  canCreateRole,
  CREATABLE_ROLES,
  hasPermission,
  PERMISSIONS,
  ROLE_PERMISSIONS,
} from "../config/permissions.js";
import type { Role } from "../generated/prisma/enums.js";
import { createAuthHarness, type AuthHarness } from "../test/authHarness.js";

const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";

/** Create a user of the given role, sign in, and return their access token. */
async function signIn(
  h: AuthHarness,
  role: Role,
  extra: { profile?: "student" | "instructor"; email?: string } = {},
) {
  const user = await h.createUser({
    role,
    email: extra.email ?? `${role.toLowerCase()}@example.test`,
    profile: extra.profile,
  });
  const session = await h.login(user.email!);
  return { user, token: session.accessToken };
}

describe("unauthenticated access is denied (401)", () => {
  it.each([
    ["GET", `/students/${UNKNOWN_ID}`],
    ["GET", `/instructors/${UNKNOWN_ID}`],
    ["POST", "/users"],
    ["GET", "/auth/me"],
    ["POST", "/auth/change-password"],
  ])("%s %s", async (method, path) => {
    const h = createAuthHarness();
    const res = method === "GET" ? await h.api.get(path) : await h.api.post(path).send({});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("does not run validation or leak anything before authentication", async () => {
    const h = createAuthHarness();
    const res = await h.api.post("/users").send({ role: "NOT_A_ROLE" });
    expect(res.status).toBe(401);
  });

  it("unknown routes under protected prefixes are not silently open", async () => {
    const h = createAuthHarness();
    expect((await h.api.get("/students")).status).toBe(401);
    expect((await h.api.get("/users")).status).toBe(401);
  });
});

describe("forbidden access (403): the role lacks the permission", () => {
  it("a STUDENT cannot create users or read instructors", async () => {
    const h = createAuthHarness();
    const s = await signIn(h, "STUDENT", { profile: "student" });
    expect((await h.api.post("/users").set(h.bearer(s.token)).send({})).status).toBe(403);
    expect((await h.api.get(`/instructors/${UNKNOWN_ID}`).set(h.bearer(s.token))).status).toBe(403);
  });

  it("an INSTRUCTOR cannot create users", async () => {
    const h = createAuthHarness();
    const i = await signIn(h, "INSTRUCTOR", { profile: "instructor" });
    const res = await h.api.post("/users").set(h.bearer(i.token)).send({});
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("permission is decided before the body is even looked at", async () => {
    const h = createAuthHarness();
    const s = await signIn(h, "STUDENT", { profile: "student" });
    const res = await h.api
      .post("/users")
      .set(h.bearer(s.token))
      .send({ role: "OWNER", fullName: "x" });
    expect(res.status).toBe(403); // not 400
    expect(h.db.user.rows).toHaveLength(1); // nothing was created
  });
});

describe("ownership: GET /students/:id", () => {
  async function twoStudents(h: AuthHarness) {
    const a = await signIn(h, "STUDENT", { profile: "student", email: "a@example.test" });
    const b = await signIn(h, "STUDENT", { profile: "student", email: "b@example.test" });
    return {
      a,
      b,
      aId: (a.user as { profileId: string }).profileId,
      bId: (b.user as { profileId: string }).profileId,
    };
  }

  it("a student can read their OWN record", async () => {
    const h = createAuthHarness();
    const { a, aId } = await twoStudents(h);
    const res = await h.api.get(`/students/${aId}`).set(h.bearer(a.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: aId, email: "a@example.test", status: "ACTIVE" });
  });

  it("changing the id in the URL to another student's returns 404, never their data", async () => {
    const h = createAuthHarness();
    const { a, bId } = await twoStudents(h);
    const res = await h.api.get(`/students/${bId}`).set(h.bearer(a.token));
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain("b@example.test");
  });

  it("gives the same 404 for another student's record and for one that does not exist (no existence leak)", async () => {
    const h = createAuthHarness();
    const { a, bId } = await twoStudents(h);
    const other = await h.api.get(`/students/${bId}`).set(h.bearer(a.token));
    const missing = await h.api.get(`/students/${UNKNOWN_ID}`).set(h.bearer(a.token));
    expect(other.status).toBe(404);
    expect(other.body).toEqual(missing.body);
  });

  it("rejects a malformed id", async () => {
    const h = createAuthHarness();
    const { a } = await twoStudents(h);
    expect((await h.api.get("/students/123").set(h.bearer(a.token))).status).toBe(400);
  });

  it("staff (OWNER, ADMIN) can read any student", async () => {
    const h = createAuthHarness();
    const { bId } = await twoStudents(h);
    for (const role of ["OWNER", "ADMIN", "SUPER_ADMIN"] as const) {
      const staff = await signIn(h, role);
      const res = await h.api.get(`/students/${bId}`).set(h.bearer(staff.token));
      expect(res.status, role).toBe(200);
      expect(res.body.data.email).toBe("b@example.test");
    }
  });

  it("an instructor sees only students they teach, and without contact details", async () => {
    const h = createAuthHarness();
    const { aId, bId } = await twoStudents(h);
    const teacher = await signIn(h, "INSTRUCTOR", { profile: "instructor" });
    await h.db.lesson.create({
      data: { studentId: aId, instructorId: (teacher.user as { profileId: string }).profileId },
    });

    const taught = await h.api.get(`/students/${aId}`).set(h.bearer(teacher.token));
    expect(taught.status).toBe(200);
    expect(taught.body.data).toEqual({ id: aId, name: "Test STUDENT", status: "ACTIVE" }); // no email/phone/branch

    const notTaught = await h.api.get(`/students/${bId}`).set(h.bearer(teacher.token));
    expect(notTaught.status).toBe(404);
  });

  it("another instructor's students are invisible even though the role has the permission", async () => {
    const h = createAuthHarness();
    const { aId } = await twoStudents(h);
    const t1 = await signIn(h, "INSTRUCTOR", { profile: "instructor", email: "t1@example.test" });
    const t2 = await signIn(h, "INSTRUCTOR", { profile: "instructor", email: "t2@example.test" });
    await h.db.lesson.create({
      data: { studentId: aId, instructorId: (t1.user as { profileId: string }).profileId },
    });
    expect((await h.api.get(`/students/${aId}`).set(h.bearer(t1.token))).status).toBe(200);
    expect((await h.api.get(`/students/${aId}`).set(h.bearer(t2.token))).status).toBe(404);
  });

  it("deleted students are not returned to anyone", async () => {
    const h = createAuthHarness();
    const { aId } = await twoStudents(h);
    await h.db.student.update({ where: { id: aId }, data: { deletedAt: new Date() } });
    const owner = await signIn(h, "OWNER");
    expect((await h.api.get(`/students/${aId}`).set(h.bearer(owner.token))).status).toBe(404);
  });

  it("identity comes from the session: a STUDENT account with no student profile is refused", async () => {
    const h = createAuthHarness();
    const { aId } = await twoStudents(h);
    const orphan = await signIn(h, "STUDENT", { email: "noprofile@example.test" }); // STUDENT role but no profile row
    expect((await h.api.get(`/students/${aId}`).set(h.bearer(orphan.token))).status).toBe(403);
  });
});

describe("ownership: GET /instructors/:id", () => {
  it("an instructor can read only their own profile", async () => {
    const h = createAuthHarness();
    const t1 = await signIn(h, "INSTRUCTOR", { profile: "instructor", email: "t1@example.test" });
    const t2 = await signIn(h, "INSTRUCTOR", { profile: "instructor", email: "t2@example.test" });
    const own = await h.api
      .get(`/instructors/${(t1.user as { profileId: string }).profileId}`)
      .set(h.bearer(t1.token));
    const other = await h.api
      .get(`/instructors/${(t2.user as { profileId: string }).profileId}`)
      .set(h.bearer(t1.token));
    expect(own.status).toBe(200);
    expect(own.body.data.email).toBe("t1@example.test");
    expect(other.status).toBe(404);
  });

  it("staff can read any instructor", async () => {
    const h = createAuthHarness();
    const t = await signIn(h, "INSTRUCTOR", { profile: "instructor" });
    for (const role of ["OWNER", "ADMIN"] as const) {
      const staff = await signIn(h, role);
      expect(
        (
          await h.api
            .get(`/instructors/${(t.user as { profileId: string }).profileId}`)
            .set(h.bearer(staff.token))
        ).status,
      ).toBe(200);
    }
  });
});

describe("privilege escalation: POST /users", () => {
  const matrix: [Role, Role, boolean][] = [
    ["SUPER_ADMIN", "OWNER", true],
    ["SUPER_ADMIN", "ADMIN", true],
    ["SUPER_ADMIN", "INSTRUCTOR", true],
    ["SUPER_ADMIN", "STUDENT", true],
    ["SUPER_ADMIN", "SUPER_ADMIN", false],
    ["OWNER", "ADMIN", true],
    ["OWNER", "INSTRUCTOR", true],
    ["OWNER", "STUDENT", true],
    ["OWNER", "OWNER", false],
    ["OWNER", "SUPER_ADMIN", false],
    ["ADMIN", "INSTRUCTOR", true],
    ["ADMIN", "STUDENT", true],
    ["ADMIN", "ADMIN", false],
    ["ADMIN", "OWNER", false],
    ["ADMIN", "SUPER_ADMIN", false],
    ["INSTRUCTOR", "STUDENT", false],
    ["INSTRUCTOR", "INSTRUCTOR", false],
    ["STUDENT", "STUDENT", false],
    ["STUDENT", "OWNER", false],
  ];

  it.each(matrix)("%s creating a %s → %s", async (actorRole, targetRole, allowed) => {
    const h = createAuthHarness();
    const actor = await signIn(h, actorRole, {
      profile:
        actorRole === "STUDENT" ? "student" : actorRole === "INSTRUCTOR" ? "instructor" : undefined,
    });
    const branch = await h.ensureBranch();
    const before = h.db.user.rows.length;

    const res = await h.api.post("/users").set(h.bearer(actor.token)).send({
      role: targetRole,
      fullName: "New Person",
      email: "new.person@example.test",
      branchId: branch.id,
    });

    if (allowed) {
      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe(targetRole);
      expect(h.db.user.rows).toHaveLength(before + 1);
    } else {
      expect(res.status).toBe(403);
      expect(h.db.user.rows).toHaveLength(before); // nothing created
      expect(h.db.authToken.rows).toHaveLength(0); // no invitation issued
    }
  });

  it("the caller's role always comes from the session, never from the request body", async () => {
    const h = createAuthHarness();
    const admin = await signIn(h, "ADMIN");
    const res = await h.api.post("/users").set(h.bearer(admin.token)).send({
      role: "OWNER",
      fullName: "Sneaky",
      email: "s@example.test",
      actorRole: "SUPER_ADMIN",
      createdBy: "someone",
      asRole: "OWNER",
    });
    expect(res.status).toBe(403);
  });

  it("audits denied attempts (role only, no personal data)", async () => {
    const h = createAuthHarness();
    const admin = await signIn(h, "ADMIN");
    await h.api
      .post("/users")
      .set(h.bearer(admin.token))
      .send({ role: "OWNER", fullName: "Sneaky", email: "s@example.test" });
    const entry = h.db.auditLog.rows.find((r) => r.action === "user.create_denied")!;
    expect(entry.actorId).toBe(admin.user.id);
    expect(entry.after).toEqual({ attemptedRole: "OWNER", actorRole: "ADMIN" });
  });

  it("students and instructors need a real, active branch", async () => {
    const h = createAuthHarness();
    const owner = await signIn(h, "OWNER");
    const missing = await h.api
      .post("/users")
      .set(h.bearer(owner.token))
      .send({ role: "STUDENT", fullName: "No Branch", email: "n@example.test" });
    expect(missing.status).toBe(400);
    expect(JSON.stringify(missing.body.error.details)).toMatch(/branch/i);

    const bogus = await h.api.post("/users").set(h.bearer(owner.token)).send({
      role: "STUDENT",
      fullName: "Bad Branch",
      email: "n@example.test",
      branchId: UNKNOWN_ID,
    });
    expect(bogus.status).toBe(400);
    expect(h.db.user.rows).toHaveLength(1);
  });

  it("creates the matching profile and an unusable placeholder password (nobody can sign in until they accept)", async () => {
    const h = createAuthHarness();
    const owner = await signIn(h, "OWNER");
    const branch = await h.ensureBranch();
    const res = await h.api.post("/users").set(h.bearer(owner.token)).send({
      role: "INSTRUCTOR",
      fullName: "Ravi Kumar",
      email: "ravi@example.test",
      branchId: branch.id,
    });
    expect(res.status).toBe(201);
    expect(h.db.instructor.rows).toHaveLength(1);
    expect(res.body.data.user).toEqual({
      id: expect.any(String),
      name: "Ravi Kumar",
      role: "INSTRUCTOR",
      email: "ravi@example.test",
      phone: null,
    });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|token/i); // no link when an email is used
    expect((await h.login("ravi@example.test", "Any-guess-at-all-1")).res.status).toBe(401);
  });

  it("rejects a duplicate email or phone with 409", async () => {
    const h = createAuthHarness();
    const owner = await signIn(h, "OWNER");
    const branch = await h.ensureBranch();
    const body = {
      role: "STUDENT",
      fullName: "Dup Person",
      email: "dup@example.test",
      branchId: branch.id,
    };
    expect((await h.api.post("/users").set(h.bearer(owner.token)).send(body)).status).toBe(201);
    expect((await h.api.post("/users").set(h.bearer(owner.token)).send(body)).status).toBe(409);
  });

  it("validates the payload (a contact method is required)", async () => {
    const h = createAuthHarness();
    const owner = await signIn(h, "OWNER");
    const branch = await h.ensureBranch();
    const res = await h.api
      .post("/users")
      .set(h.bearer(owner.token))
      .send({ role: "STUDENT", fullName: "No Contact", branchId: branch.id });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("the permission matrix", () => {
  const has = (role: Role, ...permissions: (typeof PERMISSIONS)[number][]) =>
    permissions.every((p) => hasPermission(role, p));
  const lacks = (role: Role, ...permissions: (typeof PERMISSIONS)[number][]) =>
    permissions.every((p) => !hasPermission(role, p));

  it("SUPER_ADMIN has every permission; OWNER has every business permission but not system:manage", () => {
    expect(PERMISSIONS.every((p) => hasPermission("SUPER_ADMIN", p))).toBe(true);
    expect(lacks("OWNER", "system:manage")).toBe(true);
    expect(
      PERMISSIONS.filter((p) => p !== "system:manage").every((p) => hasPermission("OWNER", p)),
    ).toBe(true);
  });

  it("ADMIN runs operations but cannot touch revenue, refunds, settings, audit or system", () => {
    expect(
      has(
        "ADMIN",
        "area:admin",
        "student:write",
        "booking:write",
        "payment:write",
        "package:write",
        "user:create",
      ),
    ).toBe(true);
    expect(
      lacks(
        "ADMIN",
        "payment:refund",
        "settings:write",
        "report:revenue",
        "audit:read",
        "system:manage",
      ),
    ).toBe(true);
  });

  it("INSTRUCTOR has only own-profile and assigned-lesson permissions", () => {
    expect(
      has(
        "INSTRUCTOR",
        "area:instructor",
        "student:read:assigned",
        "lesson:write:assigned",
        "progress:write:assigned",
      ),
    ).toBe(true);
    expect(
      lacks(
        "INSTRUCTOR",
        "student:read",
        "student:write",
        "user:create",
        "payment:read",
        "package:write",
        "area:admin",
        "area:student",
      ),
    ).toBe(true);
  });

  it("STUDENT has only own-record permissions", () => {
    expect(
      has(
        "STUDENT",
        "area:student",
        "student:read:self",
        "booking:write:self",
        "payment:read:self",
      ),
    ).toBe(true);
    expect(
      lacks(
        "STUDENT",
        "student:read",
        "instructor:read",
        "user:create",
        "payment:write",
        "area:admin",
        "area:instructor",
      ),
    ).toBe(true);
  });

  it("areas are exclusive: each role enters only its own area(s)", () => {
    for (const role of ["SUPER_ADMIN", "OWNER", "ADMIN"] as const)
      expect(has(role, "area:admin")).toBe(true);
    expect(has("INSTRUCTOR", "area:instructor")).toBe(true);
    expect(lacks("INSTRUCTOR", "area:admin", "area:student")).toBe(true);
    expect(has("STUDENT", "area:student")).toBe(true);
    expect(lacks("STUDENT", "area:admin", "area:instructor")).toBe(true);
  });

  it("no role can create a role at or above its own level, and SUPER_ADMIN is never creatable through the API", () => {
    for (const role of Object.keys(CREATABLE_ROLES) as Role[]) {
      expect(CREATABLE_ROLES[role]).not.toContain("SUPER_ADMIN");
      expect(CREATABLE_ROLES[role]).not.toContain(role);
    }
    expect(canCreateRole("ADMIN", "ADMIN")).toBe(false);
    expect(canCreateRole("OWNER", "OWNER")).toBe(false);
    expect(CREATABLE_ROLES.INSTRUCTOR).toEqual([]);
    expect(CREATABLE_ROLES.STUDENT).toEqual([]);
  });

  it("every role's permission set contains only known permissions", () => {
    for (const role of Object.keys(ROLE_PERMISSIONS) as Role[]) {
      for (const p of ROLE_PERMISSIONS[role]) expect(PERMISSIONS).toContain(p);
    }
  });

  it("a `:self` permission alone never implies broader access", () => {
    for (const p of PERMISSIONS.filter((x) => x.endsWith(":self"))) {
      const broader = p.replace(":self", "") as (typeof PERMISSIONS)[number];
      if (hasPermission("STUDENT", p)) expect(hasPermission("STUDENT", broader)).toBe(false);
    }
  });
});
