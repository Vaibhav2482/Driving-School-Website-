import type { Role } from "../generated/prisma/enums.js";

/**
 * Every permission in the system. Routes declare which permission(s) they need with
 * `requirePermission(...)`; a route that declares none is not reachable (deny by default).
 *
 * Naming: `resource:action` for staff-wide access, `resource:action:self` for a person's own records,
 * `resource:action:assigned` for an instructor's assigned students/lessons. Holding a `:self` or
 * `:assigned` permission never grants access on its own: services must also scope the query to the
 * authenticated identity (see `modules/access.ts`).
 */
export const PERMISSIONS = [
  // Which application areas a person may enter (used by the web app's route guards).
  "area:admin",
  "area:student",
  "area:instructor",

  "user:create",
  "user:read",

  "student:read",
  "student:read:self",
  "student:read:assigned",
  "student:write",
  "student:write:self",

  "instructor:read",
  "instructor:read:self",
  "instructor:write",
  "instructor:write:self",

  "enquiry:read",
  "enquiry:write",

  "package:read",
  "package:write",

  "booking:read",
  "booking:read:self",
  "booking:write",
  "booking:write:self",

  "lesson:read",
  "lesson:read:self",
  "lesson:read:assigned",
  "lesson:write",
  "lesson:write:assigned",

  "progress:read:self",
  "progress:write:assigned",

  "vehicle:read",
  "vehicle:write",

  "payment:read",
  "payment:read:self",
  "payment:write",
  "payment:refund",

  "rta:read",
  "rta:write",

  "review:read",
  "review:write",

  "notification:read:self",

  "settings:read",
  "settings:write",
  "report:read",
  "report:revenue",
  "audit:read",

  /** Platform-level operations (developer role only). */
  "system:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: readonly Permission[] = PERMISSIONS;

const OWNER: readonly Permission[] = PERMISSIONS.filter((p) => p !== "system:manage");

const ADMIN: readonly Permission[] = [
  "area:admin",
  "user:create",
  "user:read",
  "student:read",
  "student:write",
  "instructor:read",
  "instructor:write",
  "enquiry:read",
  "enquiry:write",
  "package:read",
  "package:write",
  "booking:read",
  "booking:write",
  "lesson:read",
  "lesson:write",
  "vehicle:read",
  "vehicle:write",
  "payment:read",
  "payment:write", // records payments; refunds stay with the owner
  "rta:read",
  "rta:write",
  "review:read",
  "review:write",
  "settings:read",
  "report:read", // operational reports; revenue is owner-only
];

const INSTRUCTOR: readonly Permission[] = [
  "area:instructor",
  "instructor:read:self",
  "instructor:write:self",
  "student:read:assigned",
  "lesson:read:assigned",
  "lesson:write:assigned",
  "progress:write:assigned",
  "notification:read:self",
];

const STUDENT: readonly Permission[] = [
  "area:student",
  "student:read:self",
  "student:write:self",
  "booking:read:self",
  "booking:write:self",
  "lesson:read:self",
  "progress:read:self",
  "payment:read:self",
  "notification:read:self",
];

export const ROLE_PERMISSIONS: Readonly<Record<Role, ReadonlySet<Permission>>> = {
  SUPER_ADMIN: new Set(ALL),
  OWNER: new Set(OWNER),
  ADMIN: new Set(ADMIN),
  INSTRUCTOR: new Set(INSTRUCTOR),
  STUDENT: new Set(STUDENT),
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function hasAnyPermission(role: Role, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/** The permission list sent to the web app so it can hide UI. The API never relies on the client for this. */
export function permissionsFor(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

/**
 * Privilege-escalation rules: which roles each role may create. Nobody can create a role at or above
 * their own level, and SUPER_ADMIN accounts are never created through the API (seed or CLI only).
 */
export const CREATABLE_ROLES: Readonly<Record<Role, readonly Role[]>> = {
  SUPER_ADMIN: ["OWNER", "ADMIN", "INSTRUCTOR", "STUDENT"],
  OWNER: ["ADMIN", "INSTRUCTOR", "STUDENT"],
  ADMIN: ["INSTRUCTOR", "STUDENT"],
  INSTRUCTOR: [],
  STUDENT: [],
};

export const canCreateRole = (actor: Role, target: Role): boolean =>
  CREATABLE_ROLES[actor].includes(target);

/** Roles that work for the business (as opposed to learners). */
export const STAFF_ROLES: readonly Role[] = ["SUPER_ADMIN", "OWNER", "ADMIN", "INSTRUCTOR"];
